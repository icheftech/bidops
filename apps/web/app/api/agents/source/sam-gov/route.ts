/**
 * POST /api/agents/source/sam-gov
 *
 * Ingests opportunities from SAM.gov into the database for a tenant.
 * Called by the background worker on a schedule, or manually triggered.
 *
 * Auth: internal service secret (not user JWT)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  scanAiRoboticsOpportunities,
  scanTexasOpportunities,
  scanSetAsideOpportunities,
  transformSamOpportunity,
} from "@/lib/sam-gov";

export async function POST(req: NextRequest) {
  // Verify internal service secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.API_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tenantId, scanType = "all" } = body;

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  // Verify tenant exists and is active
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, status: true },
  });

  if (!tenant || tenant.status !== "ACTIVE") {
    return NextResponse.json({ error: "Tenant not found or inactive" }, { status: 404 });
  }

  const startedAt = Date.now();
  let ingested = 0;
  let skipped  = 0;
  let errors   = 0;

  try {
    // Run scans based on type
    const scanResults = await runScans(scanType);

    for (const opp of scanResults) {
      try {
        const transformed = transformSamOpportunity(opp);

        // Upsert — skip if fingerprint already exists for this tenant
        const existing = await prisma.opportunity.findFirst({
          where: { tenantId, fingerprint: transformed.fingerprint },
          select: { id: true },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.opportunity.create({
          data: { tenantId, ...transformed },
        });

        // Log to audit trail
        await prisma.auditLog.create({
          data: {
            tenantId,
            entityType: "opportunity",
            entityId:   "pending", // updated after create in real impl
            agentId:    "sourcing-agent",
            action:     "opportunity.ingested",
            payload: {
              source:   "SAM_GOV",
              sourceId: opp.noticeId,
              title:    opp.title,
              naics:    opp.naicsCode,
              domain:   transformed.domain,
            },
            actorType: "AGENT",
          },
        });

        ingested++;
      } catch (err) {
        errors++;
        console.error(`Failed to ingest opportunity ${opp.noticeId}:`, err);
      }
    }

    const elapsed = Date.now() - startedAt;

    return NextResponse.json({
      success: true,
      scanType,
      totalFound: scanResults.length,
      ingested,
      skipped,
      errors,
      elapsedMs: elapsed,
    });
  } catch (err) {
    console.error("SAM.gov scan failed:", err);
    return NextResponse.json(
      { error: "Scan failed", details: String(err) },
      { status: 500 }
    );
  }
}

async function runScans(scanType: string) {
  if (scanType === "ai_robotics") {
    const result = await scanAiRoboticsOpportunities(7);
    return result.opportunities;
  }

  if (scanType === "texas") {
    const result = await scanTexasOpportunities(3);
    return result.opportunities;
  }

  if (scanType === "set_asides") {
    const result = await scanSetAsideOpportunities(7);
    return result.opportunities;
  }

  // "all" — run all scans in parallel and deduplicate
  const [aiResult, texasResult, setAsideResult] = await Promise.allSettled([
    scanAiRoboticsOpportunities(7),
    scanTexasOpportunities(3),
    scanSetAsideOpportunities(7),
  ]);

  const all = [];
  if (aiResult.status === "fulfilled")       all.push(...aiResult.value.opportunities);
  if (texasResult.status === "fulfilled")    all.push(...texasResult.value.opportunities);
  if (setAsideResult.status === "fulfilled") all.push(...setAsideResult.value.opportunities);

  // Deduplicate by noticeId
  const seen = new Set<string>();
  return all.filter(o => {
    if (seen.has(o.noticeId)) return false;
    seen.add(o.noticeId);
    return true;
  });
}
