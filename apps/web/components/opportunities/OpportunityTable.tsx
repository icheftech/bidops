import Link from 'next/link'

const DOMAIN_COLORS: Record<string, string> = {
  AI_ROBOTICS:          'bg-brand-100 text-brand-700',
  IT_STAFFING:          'bg-blue-100 text-blue-700',
  MANAGED_IT:           'bg-indigo-100 text-indigo-700',
  PROFESSIONAL_SERVICES:'bg-purple-100 text-purple-700',
  LOGISTICS:            'bg-orange-100 text-orange-700',
  OTHER:                'bg-gray-100 text-gray-600',
}

const STATUS_COLORS: Record<string, string> = {
  NEW:      'bg-gray-100 text-gray-600',
  SCORING:  'bg-yellow-100 text-yellow-700',
  SCORED:   'bg-blue-100 text-blue-700',
  PURSUING: 'bg-green-100 text-green-700',
  PASSED:   'bg-red-100 text-red-600',
  EXPIRED:  'bg-gray-100 text-gray-400',
}

interface Opportunity {
  id:                 string
  title:              string
  agency:             string | null
  naicsCode:          string | null
  domain:             string
  status:             string
  source:             string
  dueDate:            Date | null
  estimatedValue:     any
  score:              number | null
  hubApplicable:      boolean
  solicitationNumber: string | null
}

interface Props {
  opportunities: Opportunity[]
  total:         number
  page:          number
  limit:         number
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-gray-300'
  if (score >= 70)    return 'text-green-600'
  if (score >= 40)    return 'text-amber-500'
  return 'text-gray-400'
}

export function OpportunityTable({ opportunities, total, page, limit }: Props) {
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">Score</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Title / Agency</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Domain</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Due</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {opportunities.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-gray-400 text-sm">
                  No opportunities match your filters. Run an ingest to pull from SAM.gov.
                </td>
              </tr>
            ) : (
              opportunities.map(opp => (
                <tr key={opp.id} className="hover:bg-gray-50 transition-colors">

                  {/* Score */}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-base font-bold ${scoreColor(opp.score)}`}>
                      {opp.score ?? '—'}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3 max-w-sm">
                    <Link href={`/opportunities/${opp.id}`} className="font-medium text-gray-900 hover:text-brand-600 line-clamp-2 leading-snug">
                      {opp.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400 truncate">{opp.agency ?? 'Unknown agency'}</span>
                      {opp.solicitationNumber && (
                        <span className="text-xs text-gray-300">· {opp.solicitationNumber}</span>
                      )}
                      {opp.hubApplicable && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">HUB</span>
                      )}
                    </div>
                  </td>

                  {/* Domain */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DOMAIN_COLORS[opp.domain] ?? 'bg-gray-100 text-gray-600'}`}>
                      {opp.domain.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Source */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-gray-500">{opp.source.replace(/_/g, ' ')}</span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[opp.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {opp.status}
                    </span>
                  </td>

                  {/* Due date */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    {opp.dueDate ? new Date(opp.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    {opp.estimatedValue
                      ? `$${Number(opp.estimatedValue).toLocaleString()}`
                      : '—'}
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Prev
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}`}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
