import { requireSession } from '@/lib/auth'
import { db } from '@bidops/db'
import Topbar from '@/components/layout/Topbar'
import Sidebar from '@/components/layout/Sidebar'
import OpportunitiesClient from '@/components/opportunities/OpportunitiesClient'
import type { Opportunity } from '@bidops/types'

export const dynamic = 'force-dynamic'

export default async function OpportunitiesPage() {
  const session = await requireSession()
  const { tenantId } = session.user

  // Fetch all opportunities for this tenant
  const raw = await db.opportunity.findMany({
    where: { tenantId },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    take: 500,
  })

  // Sidebar counts
  const counts = {
    all:          raw.length,
    pursuing:     raw.filter(o => o.status === 'PURSUING').length,
    scored:       raw.filter(o => o.status === 'SCORED').length,
    newCount:     raw.filter(o => o.status === 'NEW').length,
    passed:       raw.filter(o => o.status === 'PASSED').length,
    aiRobotics:   raw.filter(o => o.domain === 'AI_ROBOTICS').length,
    itStaffing:   raw.filter(o => o.domain === 'IT_STAFFING').length,
    managedIt:    raw.filter(o => o.domain === 'MANAGED_IT').length,
    profServices: raw.filter(o => o.domain === 'PROFESSIONAL_SERVICES').length,
    logistics:    raw.filter(o => o.domain === 'LOGISTICS').length,
    samGov:       raw.filter(o => o.source === 'SAM_GOV').length,
    esbd:         raw.filter(o => o.source === 'ESBD_TEXAS').length,
    cityHouston:  raw.filter(o => o.source === 'CITY_OF_HOUSTON').length,
    harrisCounty: raw.filter(o => o.source === 'HARRIS_COUNTY').length,
    demandStar:   raw.filter(o => o.source === 'DEMANDSTAR').length,
  }

  // Serialize dates for client component
  const opportunities = raw.map(o => ({
    ...o,
    estimatedValue: o.estimatedValue ? Number(o.estimatedValue) : null,
    catalogCoveragePercent: o.catalogCoveragePercent ? Number(o.catalogCoveragePercent) : null,
    postedDate: o.postedDate?.toISOString() ?? null,
    dueDate:    o.dueDate?.toISOString() ?? null,
    createdAt:  o.createdAt.toISOString(),
    updatedAt:  o.updatedAt.toISOString(),
  })) as unknown as Opportunity[]

  return (
    <div className="app-shell">
      <Topbar />
      <div className="body-wrap">
        <Sidebar counts={counts} />
        <div className="page-content">
          <OpportunitiesClient
            initialOpportunities={opportunities}
            tenantId={tenantId}
          />
        </div>
      </div>
    </div>
  )
}
