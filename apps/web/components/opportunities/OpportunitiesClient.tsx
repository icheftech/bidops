'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Opportunity } from '@bidops/types'

// ─── CONSTANTS ────────────────────────────────────────────────
const DOMAIN_META: Record<string, { label: string; cls: string }> = {
  AI_ROBOTICS:          { label: 'AI & Robotics',   cls: 'badge-ai'  },
  IT_STAFFING:          { label: 'IT Staffing',      cls: 'badge-it'  },
  MANAGED_IT:           { label: 'Managed IT',       cls: 'badge-mit' },
  PROFESSIONAL_SERVICES:{ label: 'Prof. Services',   cls: 'badge-ps'  },
  LOGISTICS:            { label: 'Logistics',        cls: 'badge-log' },
}

const SRC_LABEL: Record<string, string> = {
  SAM_GOV:        'SAM.GOV',
  ESBD_TEXAS:     'ESBD TX',
  CITY_OF_HOUSTON:'HOUSTON',
  HARRIS_COUNTY:  'HARRIS CO',
  METRO_HARRIS:   'METRO',
  HGAC:           'H-GAC',
  DEMANDSTAR:     'DEMANDSTAR',
  IONWAVE:        'IONWAVE',
  EUNA:           'EUNA',
  OPENGOV:        'OPENGOV',
  EMAIL_INBOUND:  'EMAIL',
  MANUAL:         'MANUAL',
}

const SCORE_BREAKDOWN_LABELS = [
  { key: 'hubSetAside',         label: 'HUB Set-Aside',   max: 25, color: 'var(--gold)'   },
  { key: 'naicsMatch',          label: 'NAICS Match',      max: 20, color: 'var(--green-b)'},
  { key: 'localAgency',         label: 'Local Agency',     max: 15, color: '#6ab0e8'       },
  { key: 'smallBusinessSetAside', label: 'SB Set-Aside',   max: 20, color: '#a48de8'       },
  { key: 'pastPerformanceMatch',label: 'Past Perf Match',  max: 15, color: '#e0944a'       },
  { key: 'compliancePenalty',   label: 'Compliance',       max: 50, color: '#e05a4e'       },
]

// ─── HELPERS ──────────────────────────────────────────────────
function fmtValue(n: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

function daysUntil(d: Date | null): number | null {
  if (!d) return null
  return Math.round((new Date(d).getTime() - Date.now()) / 86_400_000)
}

function fmtDate(d: Date | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  return `${dt.getMonth() + 1}/${dt.getDate()}/${String(dt.getFullYear()).slice(2)}`
}

function scoreColor(s: number | null): string {
  if (!s) return 'var(--txt-d)'
  if (s >= 75) return 'var(--green-b)'
  if (s >= 50) return 'var(--gold)'
  return 'var(--txt-d)'
}

function deadlineCls(d: Date | null): string {
  const n = daysUntil(d)
  if (n === null) return 'deadline-ok'
  if (n <= 7)     return 'deadline-urgent'
  if (n <= 14)    return 'deadline-soon'
  return 'deadline-ok'
}

// ─── TYPES ────────────────────────────────────────────────────
type SortField = 'title' | 'score' | 'domain' | 'source' | 'naicsCode' | 'estimatedValue' | 'dueDate'
type ActivePills = Set<'hub' | 'ai' | 'sb'>

interface Props {
  initialOpportunities: Opportunity[]
  tenantId: string
}

// ─── DETAIL PANEL ─────────────────────────────────────────────
function DetailPanel({
  opp,
  onClose,
  onPursue,
  onPass,
}: {
  opp: Opportunity | null
  onClose: () => void
  onPursue: (id: string) => void
  onPass: (id: string) => void
}) {
  if (!opp) return null

  const reasoning = (opp.scoreReasoning as Record<string, number> | null) ?? {}
  const fields: [string, string][] = [
    ['NAICS Code',   opp.naicsCode ?? '—'],
    ['PSC Code',     (opp as any).pscCode ?? '—'],
    ['Domain',       DOMAIN_META[opp.domain]?.label ?? opp.domain],
    ['Source',       SRC_LABEL[opp.source] ?? opp.source],
    ['Est. Value',   fmtValue(opp.estimatedValue ? Number(opp.estimatedValue) : null)],
    ['Due Date',     fmtDate(opp.dueDate)],
    ['Set-Aside',    opp.setAsideType.replace(/_/g, ' ')],
    ['Status',       opp.status],
    ['Catalog Cov.', opp.catalogCoveragePercent ? `${Number(opp.catalogCoveragePercent).toFixed(0)}%` : '—'],
  ]

  return (
    <div className="detail-panel">
      <div className="detail-head">
        <button className="detail-close" onClick={onClose}>✕</button>
        <div className="detail-title">{opp.title}</div>
        <div className="detail-agency">{opp.agency ?? 'Unknown agency'}</div>
      </div>

      <div className="detail-body">
        {/* Score */}
        <div>
          <div className="detail-sec">Opportunity Score</div>
          <div className="detail-score-num" style={{ color: scoreColor(opp.score) }}>
            {opp.score ?? '—'}
          </div>
          <div>
            {SCORE_BREAKDOWN_LABELS.map(({ key, label, max, color }) => {
              const val = reasoning[key] ?? 0
              return (
                <div className="breakdown-row" key={key}>
                  <div className="breakdown-label">{label}</div>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{ width: `${(Math.abs(val) / max) * 100}%`, background: color }} />
                  </div>
                  <div className="breakdown-val" style={{ color }}>
                    {val > 0 ? '+' : ''}{val}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Contract Details */}
        <div>
          <div className="detail-sec">Contract Details</div>
          {fields.map(([label, val]) => (
            <div className="detail-field" key={label}>
              <span className="detail-field-label">{label}</span>
              <span className="detail-field-val">{val}</span>
            </div>
          ))}
        </div>

        {/* Flags */}
        <div>
          <div className="detail-sec">Scoring Flags</div>
          <div className="flags-wrap">
            {opp.hubApplicable && <span className="flag-tag">HUB APPLICABLE</span>}
            {opp.setAsideType !== 'NONE' && opp.setAsideType !== 'UNKNOWN' && (
              <span className="flag-tag">{opp.setAsideType.replace(/_/g, ' ')}</span>
            )}
            {(opp as any).pscCode && <span className="flag-tag">PSC {(opp as any).pscCode}</span>}
            {opp.domain === 'AI_ROBOTICS' && <span className="flag-tag">PRIMARY DOMAIN</span>}
            {(opp.score ?? 0) >= 75 && <span className="flag-tag">HIGH SCORE</span>}
          </div>
        </div>
      </div>

      <div className="detail-actions">
        <button className="btn-green" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onPursue(opp.id)}>
          Pursue →
        </button>
        <button className="btn-ghost" style={{ flex: 1 }} onClick={() => onPass(opp.id)}>
          Pass
        </button>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function OpportunitiesClient({ initialOpportunities, tenantId }: Props) {
  const [opps, setOpps] = useState<Opportunity[]>(initialOpportunities)
  const [search, setSearch] = useState('')
  const [filterDomain, setFilterDomain] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortDir, setSortDir] = useState<1 | -1>(-1)
  const [pills, setPills] = useState<ActivePills>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [ingesting, setIngesting] = useState(false)
  const [lastSync, setLastSync] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )

  const selectedOpp = useMemo(() => opps.find(o => o.id === selectedId) ?? null, [opps, selectedId])

  // ── Stats
  const stats = useMemo(() => {
    const scored = opps.filter(o => o.score !== null)
    const avg = scored.length
      ? Math.round(scored.reduce((s, o) => s + (o.score ?? 0), 0) / scored.length)
      : null
    const urgent = opps.filter(o => { const d = daysUntil(o.dueDate); return d !== null && d >= 0 && d <= 7 })
    return {
      total:   opps.filter(o => o.status !== 'PASSED').length,
      hub:     opps.filter(o => o.hubApplicable).length,
      ai:      opps.filter(o => o.domain === 'AI_ROBOTICS').length,
      avg:     avg ?? null,
      urgent:  urgent.length,
      newOpps: opps.filter(o => o.status === 'NEW').length,
    }
  }, [opps])

  // ── Sidebar counts
  const counts = useMemo(() => ({
    all:          opps.length,
    pursuing:     opps.filter(o => o.status === 'PURSUING').length,
    scored:       opps.filter(o => o.status === 'SCORED').length,
    newCount:     opps.filter(o => o.status === 'NEW').length,
    passed:       opps.filter(o => o.status === 'PASSED').length,
    aiRobotics:   opps.filter(o => o.domain === 'AI_ROBOTICS').length,
    itStaffing:   opps.filter(o => o.domain === 'IT_STAFFING').length,
    managedIt:    opps.filter(o => o.domain === 'MANAGED_IT').length,
    profServices: opps.filter(o => o.domain === 'PROFESSIONAL_SERVICES').length,
    logistics:    opps.filter(o => o.domain === 'LOGISTICS').length,
    samGov:       opps.filter(o => o.source === 'SAM_GOV').length,
    esbd:         opps.filter(o => o.source === 'ESBD_TEXAS').length,
    cityHouston:  opps.filter(o => o.source === 'CITY_OF_HOUSTON').length,
    harrisCounty: opps.filter(o => o.source === 'HARRIS_COUNTY').length,
    demandStar:   opps.filter(o => o.source === 'DEMANDSTAR').length,
  }), [opps])

  // ── Filtered + sorted
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = opps.filter(o => {
      if (q && !o.title.toLowerCase().includes(q) && !(o.agency ?? '').toLowerCase().includes(q) && !(o.naicsCode ?? '').includes(q)) return false
      if (filterDomain && o.domain !== filterDomain) return false
      if (filterSource && o.source !== filterSource) return false
      if (filterStatus && o.status !== filterStatus) return false
      if (pills.has('hub') && !o.hubApplicable) return false
      if (pills.has('ai') && o.domain !== 'AI_ROBOTICS') return false
      if (pills.has('sb') && !['TOTAL_SMALL_BUSINESS','PARTIAL_SMALL_BUSINESS','HUB','HUB_ZONE'].includes(o.setAsideType)) return false
      return true
    })
    list = [...list].sort((a, b) => {
      const av = (a as any)[sortField]
      const bv = (b as any)[sortField]
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'string') return sortDir * av.localeCompare(bv)
      return sortDir * (Number(av) - Number(bv))
    })
    return list
  }, [opps, search, filterDomain, filterSource, filterStatus, pills, sortField, sortDir])

  // ── Actions
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortField(field); setSortDir(-1) }
  }

  const togglePill = (p: 'hub' | 'ai' | 'sb') => {
    setPills(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  const pursue = useCallback((id: string) => {
    setOpps(prev => prev.map(o => o.id === id ? { ...o, status: 'PURSUING' as const } : o))
    // TODO: POST /api/bids { opportunityId: id } → creates bid + triggers CP-1
  }, [])

  const pass = useCallback((id: string) => {
    setOpps(prev => prev.map(o => o.id === id ? { ...o, status: 'PASSED' as const } : o))
    setSelectedId(null)
    // TODO: POST /api/opportunities/:id/pass
  }, [])

  const triggerIngest = async () => {
    setIngesting(true)
    try {
      await fetch('/api/opportunities/ingest', { method: 'POST' })
      setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      // TODO: refresh opportunities list from server
    } finally {
      setIngesting(false)
    }
  }

  const thClass = (f: SortField) => `${sortField === f ? 'sorted' : ''}`
  const thLabel = (f: SortField, label: string) =>
    `${label}${sortField === f ? (sortDir === -1 ? ' ↓' : ' ↑') : ''}`

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* PAGE HEAD */}
      <div className="page-head">
        <div>
          <div className="page-title">Opportunities</div>
          <div className="page-meta">LAST SYNC — {lastSync}</div>
        </div>
        <button className="btn-gold" onClick={triggerIngest} disabled={ingesting}>
          <span style={{ width: 5, height: 5, background: 'var(--gold)', borderRadius: '50%', display: 'inline-block' }} />
          {ingesting ? 'Ingesting…' : 'Run Ingest'}
        </button>
      </div>

      {/* STATS STRIP */}
      <div className="stats-strip" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-cell">
          <div className="stat-label">Total Active</div>
          <div className="stat-val gold">{stats.total}</div>
          <div className="stat-sub up">+{stats.newOpps} new</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">HUB Eligible</div>
          <div className="stat-val">{stats.hub}</div>
          <div className="stat-sub">set-aside or goal</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">AI / Robotics</div>
          <div className="stat-val green">{stats.ai}</div>
          <div className="stat-sub">primary domain</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Avg Score</div>
          <div className="stat-val">{stats.avg ?? '—'}</div>
          <div className="stat-sub">all scored opps</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Due &lt; 7 Days</div>
          <div className="stat-val red">{stats.urgent}</div>
          <div className="stat-sub">require action</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Search title, agency, NAICS…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
          <option value="">All Domains</option>
          <option value="AI_ROBOTICS">AI & Robotics</option>
          <option value="IT_STAFFING">IT Staffing</option>
          <option value="MANAGED_IT">Managed IT</option>
          <option value="PROFESSIONAL_SERVICES">Prof. Services</option>
          <option value="LOGISTICS">Logistics</option>
        </select>
        <select className="filter-select" value={filterSource} onChange={e => setFilterSource(e.target.value)}>
          <option value="">All Sources</option>
          <option value="SAM_GOV">SAM.gov</option>
          <option value="ESBD_TEXAS">ESBD Texas</option>
          <option value="CITY_OF_HOUSTON">City of Houston</option>
          <option value="HARRIS_COUNTY">Harris County</option>
          <option value="DEMANDSTAR">DemandStar</option>
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="NEW">New</option>
          <option value="SCORED">Scored</option>
          <option value="PURSUING">Pursuing</option>
          <option value="PASSED">Passed</option>
        </select>
        <div style={{ display:'flex', gap:5, marginLeft:4 }}>
          <button className={`pill hub${pills.has('hub') ? ' active' : ''}`} onClick={() => togglePill('hub')}>HUB Only</button>
          <button className={`pill ai${pills.has('ai') ? ' active' : ''}`} onClick={() => togglePill('ai')}>AI / Robotics</button>
          <button className={`pill sb${pills.has('sb') ? ' active' : ''}`} onClick={() => togglePill('sb')}>Set-Aside</button>
        </div>
      </div>

      {/* TABLE + DETAIL */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <div className="table-outer">
          <table className="opp-table">
            <thead>
              <tr>
                <th style={{ width:28, paddingLeft:16 }} />
                <th className={thClass('title')} onClick={() => handleSort('title')}>{thLabel('title', 'Opportunity')}</th>
                <th className={thClass('score')} onClick={() => handleSort('score')}>{thLabel('score', 'Score')}</th>
                <th className={thClass('domain')} onClick={() => handleSort('domain')}>{thLabel('domain', 'Domain')}</th>
                <th className={thClass('source')} onClick={() => handleSort('source')}>{thLabel('source', 'Source')}</th>
                <th className={thClass('naicsCode')} onClick={() => handleSort('naicsCode')}>{thLabel('naicsCode', 'NAICS')}</th>
                <th className={thClass('estimatedValue')} onClick={() => handleSort('estimatedValue')}>{thLabel('estimatedValue', 'Value')}</th>
                <th className={thClass('dueDate')} onClick={() => handleSort('dueDate')}>{thLabel('dueDate', 'Due')}</th>
                <th>Flags</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const dm = DOMAIN_META[o.domain] ?? { label: o.domain, cls: 'badge-it' }
                const src = SRC_LABEL[o.source] ?? o.source
                const days = daysUntil(o.dueDate)
                const dLabel = days === null ? '—' : days <= 0 ? 'EXPIRED' : days === 1 ? '1 day' : `${days} days`
                const dCls = deadlineCls(o.dueDate)
                const sc = scoreColor(o.score)
                const pct = Math.min(100, o.score ?? 0)
                const scCls = (o.score ?? 0) >= 75 ? 'score-high' : (o.score ?? 0) >= 50 ? 'score-mid' : 'score-low'

                return (
                  <tr
                    key={o.id}
                    className={o.id === selectedId ? 'selected' : ''}
                    onClick={() => setSelectedId(id => id === o.id ? null : o.id)}
                  >
                    <td style={{ paddingLeft:16 }}>
                      {o.hubApplicable && <span className="badge badge-hub" style={{ fontSize:9, padding:'1px 5px' }}>HUB</span>}
                    </td>
                    <td>
                      <div className="opp-title" style={{ fontSize:12, fontWeight:500, color:'var(--txt)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:280 }}>
                        {o.title}
                      </div>
                      <div style={{ fontSize:10, color:'var(--txt-d)', marginTop:2, fontFamily:'var(--font-mono)', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {o.agency ?? 'Unknown agency'}
                      </div>
                    </td>
                    <td>
                      <div className="score-wrap">
                        <div className="score-bar">
                          <div className="score-fill" style={{ width:`${pct}%`, background:sc }} />
                        </div>
                        <span className={`score-num ${scCls}`}>{o.score ?? '—'}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${dm.cls}`}>{dm.label}</span></td>
                    <td><span className="src-tag">{src}</span></td>
                    <td><span className="naics-val">{o.naicsCode ?? '—'}</span></td>
                    <td><span className="val-num">{fmtValue(o.estimatedValue ? Number(o.estimatedValue) : null)}</span></td>
                    <td>
                      <span className={`deadline ${dCls}`}>
                        {fmtDate(o.dueDate)}
                        <em className="deadline-sub">{dLabel}</em>
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:3, flexWrap:'wrap', maxWidth:130 }}>
                        {o.hubApplicable && (
                          <span className="flag-tag" style={{ fontSize:9, padding:'1px 5px' }}>HUB</span>
                        )}
                        {o.domain === 'AI_ROBOTICS' && (
                          <span className="flag-tag" style={{ fontSize:9, padding:'1px 5px' }}>AI</span>
                        )}
                        {o.setAsideType !== 'NONE' && o.setAsideType !== 'UNKNOWN' && (
                          <span className="flag-tag" style={{ fontSize:9, padding:'1px 5px' }}>SB</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="act-btn act-pursue" onClick={e => { e.stopPropagation(); pursue(o.id) }}>Pursue</button>
                        <button className="act-btn act-pass"   onClick={e => { e.stopPropagation(); pass(o.id) }}>Pass</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <div style={{ fontSize:28, marginBottom:10, opacity:.3 }}>◎</div>
              <div style={{ fontSize:12, color:'var(--txt-d)' }}>No opportunities match your filters.</div>
            </div>
          )}
        </div>

        {/* DETAIL PANEL */}
        <div className={`detail-panel${selectedOpp ? '' : ' closed'}`}>
          <DetailPanel
            opp={selectedOpp}
            onClose={() => setSelectedId(null)}
            onPursue={pursue}
            onPass={pass}
          />
        </div>
      </div>
    </>
  )
}
