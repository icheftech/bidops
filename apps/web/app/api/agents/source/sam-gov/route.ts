import { NextRequest, NextResponse } from 'next/server'
import { db } from '@bidops/db'
import { SamGovClient } from '@/lib/sam/client'
import { normalizeOpportunity } from '@/lib/sam/normalizer'

export async function POST(req: NextRequest) {
  try {
    const tenantId = process.env.DEFAULT_TENANT_ID
    if (!tenantId) {
      return NextResponse.json({ error: 'DEFAULT_TENANT_ID not set' }, { status: 500 })
    }

    const client = new SamGovClient(process.env.SAM_GOV_API_KEY ?? '')
    const results = await client.fetchAIRoboticsOpportunities()

    let created = 0
    let skipped = 0

    for (const raw of results) {
      const normalized = normalizeOpportunity(raw, tenantId)
      const existing = await db.opportunity.findFirst({
        where: { tenantId, source: normalized.source, sourceId: normalized.sourceId }
      })
      if (existing) { skipped++; continue }
      await db.opportunity.create({ data: normalized })
      created++
    }

    return NextResponse.json({ ok: true, created, skipped })
  } catch (err: any) {
    console.error('SAM.gov ingest error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
