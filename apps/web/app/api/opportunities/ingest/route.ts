import { NextRequest, NextResponse } from 'next/server'
import { db } from '@bidops/db'
import { SamGovClient } from '@/lib/sam/client'
import { normalizeSamOpportunity } from '@/lib/sam/normalizer'
import { requireSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    const { tenantId } = session.user

    const sam = new SamGovClient()

    // Fetch from all primary sources in parallel
    const [aiRobotics, byNaics, setAsides] = await Promise.allSettled([
      sam.fetchAIRoboticsOpportunities(),
      sam.fetchByNaics(),
      sam.fetchSetAsideOpportunities(),
    ])

    // Merge and deduplicate by noticeId
    const seen = new Set<string>()
    const allOpps: ReturnType<typeof normalizeSamOpportunity>[] = []

    for (const result of [aiRobotics, byNaics, setAsides]) {
      if (result.status === 'fulfilled') {
        for (const opp of result.value) {
          if (!seen.has(opp.noticeId)) {
            seen.add(opp.noticeId)
            allOpps.push(normalizeSamOpportunity(opp, tenantId))
          }
        }
      }
    }

    // Upsert all opportunities (deduplicate by source + sourceId per tenant)
    let ingested = 0
    let skipped = 0

    for (const opp of allOpps) {
      try {
        await db.opportunity.upsert({
          where: {
            tenantId_source_sourceId: {
              tenantId: opp.tenantId,
              source:   opp.source,
              sourceId: opp.sourceId,
            },
          },
          create: opp,
          update: {
            title:             opp.title,
            description:       opp.description,
            dueDate:           opp.dueDate,
            rawDocumentUrl:    opp.rawDocumentUrl,
            updatedAt:         new Date(),
          },
        })
        ingested++
      } catch {
        skipped++
      }
    }

    // Log to audit trail
    await db.auditLog.create({
      data: {
        tenantId,
        entityType: 'opportunity_batch',
        entityId:   tenantId, // batch op — use tenantId as reference
        action:     'sam_gov_ingest',
        payload:    { ingested, skipped, total: allOpps.length },
        actorType:  'system',
      },
    })

    return NextResponse.json({ ingested, skipped, total: allOpps.length })
  } catch (err) {
    console.error('Ingest error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Ingest failed' },
      { status: 500 }
    )
  }
}
