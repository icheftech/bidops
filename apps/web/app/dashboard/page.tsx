import { requireSession } from '@/lib/auth'
import { db } from '@bidops/db'

export default async function DashboardPage() {
  const session = await requireSession()
  const { tenantId } = session.user

  // Live stats
  const [
    opportunityCount,
    activeBidCount,
    pendingHitl,
    recentOpportunities,
  ] = await Promise.all([
    db.opportunity.count({ where: { tenantId, status: 'SCORED' } }),
    db.bid.count({ where: { tenantId, status: { in: ['PREPARING', 'CP1_APPROVED', 'CP2_PENDING'] } } }),
    db.hitlCheckpoint.count({ where: { tenantId, status: 'PENDING' } }),
    db.opportunity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-600">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {session.user.name ?? session.user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Scored Opportunities', value: opportunityCount, color: 'text-brand-600' },
          { label: 'Active Bids', value: activeBidCount, color: 'text-green-600' },
          { label: 'Awaiting Your Review', value: pendingHitl, color: 'text-amber-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-4xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Opportunities */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Recent Opportunities</h2>
          <a href="/opportunities" className="text-sm text-brand-500 hover:underline">View all →</a>
        </div>
        <div className="divide-y divide-gray-50">
          {recentOpportunities.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No opportunities yet. Run an ingest to pull from SAM.gov.
            </div>
          ) : (
            recentOpportunities.map(opp => (
              <div key={opp.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate max-w-xl">{opp.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {opp.agency ?? 'Unknown agency'} · {opp.naicsCode} · Due {opp.dueDate?.toLocaleDateString() ?? 'TBD'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {opp.hubApplicable && (
                    <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">HUB</span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    opp.domain === 'AI_ROBOTICS'
                      ? 'bg-brand-100 text-brand-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {opp.domain.replace('_', ' ')}
                  </span>
                  {opp.score !== null && (
                    <span className={`text-sm font-bold ${opp.score >= 70 ? 'text-green-600' : opp.score >= 40 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {opp.score}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
