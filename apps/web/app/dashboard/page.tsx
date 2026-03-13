import { requireSession } from '@/lib/auth'
import { db } from '@bidops/db'
import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import Sidebar from '@/components/layout/Sidebar'

export const dynamic = 'force-dynamic'

// ─── HELPERS ──────────────────────────────────────────────────
function fmtValue(n: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
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

const DOMAIN_LABEL: Record<string, string> = {
  AI_ROBOTICS: 'AI & Robotics', IT_STAFFING: 'IT Staffing',
  MANAGED_IT: 'Managed IT', PROFESSIONAL_SERVICES: 'Prof. Services', LOGISTICS: 'Logistics',
}
const DOMAIN_CLS: Record<string, string> = {
  AI_ROBOTICS: 'badge-ai', IT_STAFFING: 'badge-it',
  MANAGED_IT: 'badge-mit', PROFESSIONAL_SERVICES: 'badge-ps', LOGISTICS: 'badge-log',
}

// ─── PAGE ──────────────────────────────────────────────────────
export default async function DashboardPage() {
  const session = await requireSession()
  const { tenantId } = session.user

  const [opps, bids, pendingHitl, recentAgentRuns, tenant] = await Promise.all([
    db.opportunity.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
    db.bid.findMany({ where: { tenantId } }),
    db.hitlCheckpoint.count({ where: { tenantId, status: 'PENDING' } }),
    db.agentRun.findMany({ where: { tenantId }, orderBy: { startedAt: 'desc' }, take: 6 }),
    db.tenant.findUnique({ where: { id: tenantId } }),
  ])

  // ── Metrics
  const activeOpps    = opps.filter(o => o.status !== 'PASSED' && o.status !== 'EXPIRED')
  const hubOpps       = opps.filter(o => o.hubApplicable)
  const aiOpps        = opps.filter(o => o.domain === 'AI_ROBOTICS')
  const urgentOpps    = opps.filter(o => { const d = daysUntil(o.dueDate); return d !== null && d >= 0 && d <= 7 })
  const activeBids    = bids.filter(b => !['AWARDED','LOST','WITHDRAWN'].includes(b.status))
  const scoredOpps    = opps.filter(o => o.score !== null)
  const avgScore      = scoredOpps.length
    ? Math.round(scoredOpps.reduce((s, o) => s + (o.score ?? 0), 0) / scoredOpps.length)
    : null
  const pipelineValue = activeBids.reduce((s, b) => s + (b.totalPrice ? Number(b.totalPrice) : 0), 0)

  // ── Top opportunities
  const topOpps = opps
    .filter(o => o.status === 'SCORED' || o.status === 'NEW')
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 8)

  // ── Sidebar counts
  const counts = {
    all:          opps.length,
    pursuing:     opps.filter(o => o.status === 'PURSUING').length,
    scored:       opps.filter(o => o.status === 'SCORED').length,
    newCount:     opps.filter(o => o.status === 'NEW').length,
    passed:       opps.filter(o => o.status === 'PASSED').length,
    aiRobotics:   aiOpps.length,
    itStaffing:   opps.filter(o => o.domain === 'IT_STAFFING').length,
    managedIt:    opps.filter(o => o.domain === 'MANAGED_IT').length,
    profServices: opps.filter(o => o.domain === 'PROFESSIONAL_SERVICES').length,
    logistics:    opps.filter(o => o.domain === 'LOGISTICS').length,
    samGov:       opps.filter(o => o.source === 'SAM_GOV').length,
    esbd:         opps.filter(o => o.source === 'ESBD_TEXAS').length,
    cityHouston:  opps.filter(o => o.source === 'CITY_OF_HOUSTON').length,
    harrisCounty: opps.filter(o => o.source === 'HARRIS_COUNTY').length,
    demandStar:   opps.filter(o => o.source === 'DEMANDSTAR').length,
  }

  // ── Cert expiry warning
  const hubDaysLeft = tenant?.hubExpiry
    ? Math.round((new Date(tenant.hubExpiry).getTime() - Date.now()) / 86_400_000)
    : null
  const samDaysLeft = tenant?.samExpiry
    ? Math.round((new Date(tenant.samExpiry).getTime() - Date.now()) / 86_400_000)
    : null

  return (
    <div className="app-shell">
      <Topbar />
      <div className="body-wrap">
        <Sidebar counts={counts} />

        <div className="page-content" style={{ overflowY:'auto' }}>

          {/* PAGE HEAD */}
          <div className="page-head">
            <div>
              <div className="page-title">Dashboard</div>
              <div className="page-meta">
                {tenant?.name ?? 'Southern Shade Technologies'} &nbsp;·&nbsp;
                {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {pendingHitl > 0 && (
                <Link href="/opportunities?status=PURSUING" className="cp-banner" style={{ textDecoration:'none' }}>
                  <div>
                    <div className="cp-label">Awaiting Review</div>
                    <div className="cp-text">{pendingHitl} checkpoint{pendingHitl > 1 ? 's' : ''} pending your decision</div>
                  </div>
                  <span style={{ color:'var(--gold)', fontSize:18 }}>→</span>
                </Link>
              )}
            </div>
          </div>

          {/* CERT ALERTS */}
          {((hubDaysLeft !== null && hubDaysLeft <= 60) || (samDaysLeft !== null && samDaysLeft <= 60)) && (
            <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--rule)', display:'flex', gap:10 }}>
              {hubDaysLeft !== null && hubDaysLeft <= 60 && (
                <div style={{ background:'var(--amber-bg)', border:'1px solid rgba(212,136,10,0.25)', borderRadius:'var(--r-md)', padding:'8px 14px', fontSize:12, color:'var(--amber)' }}>
                  ⚠ HUB certification expires in {hubDaysLeft} days
                </div>
              )}
              {samDaysLeft !== null && samDaysLeft <= 60 && (
                <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:'var(--r-md)', padding:'8px 14px', fontSize:12, color:'#e05a4e' }}>
                  ⚠ SAM.gov registration expires in {samDaysLeft} days
                </div>
              )}
            </div>
          )}

          {/* METRICS GRID */}
          <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--rule)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
              <div className="metric-card">
                <div className="metric-label">Active Opportunities</div>
                <div className="metric-val gold">{activeOpps.length}</div>
                <div className="metric-delta up">+{opps.filter(o => o.status === 'NEW').length} new</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Active Bids</div>
                <div className="metric-val">{activeBids.length}</div>
                <div className="metric-delta">{pendingHitl} awaiting review</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Avg Opportunity Score</div>
                <div className="metric-val green">{avgScore ?? '—'}</div>
                <div className="metric-delta">{scoredOpps.length} scored</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Due This Week</div>
                <div className="metric-val red">{urgentOpps.length}</div>
                <div className="metric-delta">require immediate action</div>
              </div>
            </div>
          </div>

          {/* BOTTOM PANELS */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:0 }}>

            {/* TOP OPPORTUNITIES */}
            <div style={{ padding:'20px 24px', borderRight:'1px solid var(--rule)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, color:'var(--txt)' }}>
                  Top Opportunities
                </div>
                <Link href="/opportunities" style={{ fontSize:11, color:'var(--gold)', textDecoration:'none' }}>
                  View all →
                </Link>
              </div>

              {topOpps.length === 0 ? (
                <div style={{ padding:'40px 0', textAlign:'center', color:'var(--txt-d)', fontSize:12 }}>
                  No opportunities yet. Run an ingest to pull from SAM.gov.
                </div>
              ) : topOpps.map(o => (
                <div className="recent-row" key={o.id}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="recent-title" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {o.title}
                    </div>
                    <div className="recent-agency">
                      {o.agency ?? 'Unknown'} &nbsp;·&nbsp; {fmtDate(o.dueDate)}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                    {o.hubApplicable && (
                      <span className="badge badge-hub" style={{ fontSize:9, padding:'1px 5px' }}>HUB</span>
                    )}
                    <span className={`badge ${DOMAIN_CLS[o.domain] ?? 'badge-it'}`} style={{ fontSize:10 }}>
                      {DOMAIN_LABEL[o.domain] ?? o.domain}
                    </span>
                    {o.score !== null && (
                      <span style={{
                        fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700,
                        color: (o.score >= 75 ? 'var(--green-b)' : o.score >= 50 ? 'var(--gold)' : 'var(--txt-d)'),
                        minWidth:28, textAlign:'right'
                      }}>
                        {o.score}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display:'flex', flexDirection:'column' }}>

              {/* DOMAIN BREAKDOWN */}
              <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--rule)' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, color:'var(--txt)', marginBottom:14 }}>
                  Domain Breakdown
                </div>
                {[
                  { label:'AI & Robotics',   count:aiOpps.length,                          cls:'badge-ai',  color:'var(--green-b)' },
                  { label:'IT Staffing',     count:opps.filter(o=>o.domain==='IT_STAFFING').length, cls:'badge-it', color:'#6ab0e8' },
                  { label:'Managed IT',      count:opps.filter(o=>o.domain==='MANAGED_IT').length,  cls:'badge-mit',color:'#5aaed4' },
                  { label:'Prof. Services',  count:opps.filter(o=>o.domain==='PROFESSIONAL_SERVICES').length, cls:'badge-ps', color:'#e0944a' },
                  { label:'Logistics',       count:opps.filter(o=>o.domain==='LOGISTICS').length,   cls:'badge-log',color:'#a48de8' },
                ].map(({ label, count, cls, color }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:11, color:'var(--txt-m)' }}>{label}</span>
                        <span style={{ fontSize:11, fontFamily:'var(--font-mono)', color:'var(--txt-d)' }}>{count}</span>
                      </div>
                      <div style={{ height:2, background:'var(--rule2)', borderRadius:2 }}>
                        <div style={{
                          height:'100%', borderRadius:2, background:color,
                          width:`${opps.length ? (count / opps.length) * 100 : 0}%`
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* RECENT AGENT RUNS */}
              <div style={{ padding:'20px 20px 16px' }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, color:'var(--txt)', marginBottom:14 }}>
                  Agent Activity
                </div>
                {recentAgentRuns.length === 0 ? (
                  <div style={{ fontSize:11, color:'var(--txt-d)' }}>No agent runs yet.</div>
                ) : recentAgentRuns.map(run => (
                  <div key={run.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <div style={{
                      width:6, height:6, borderRadius:'50%', flexShrink:0,
                      background: run.status === 'COMPLETED' ? 'var(--green-b)'
                        : run.status === 'FAILED' ? '#e05a4e'
                        : run.status === 'RUNNING' ? 'var(--gold)'
                        : 'var(--txt-d)'
                    }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, color:'var(--txt-m)', textTransform:'capitalize' }}>
                        {run.agentType.replace(/_/g,' ').toLowerCase()}
                      </div>
                      <div style={{ fontSize:10, color:'var(--txt-d)', fontFamily:'var(--font-mono)' }}>
                        {new Date(run.startedAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                        {run.tokensUsed > 0 && ` · ${run.tokensUsed.toLocaleString()} tokens`}
                      </div>
                    </div>
                    <span style={{
                      fontSize:9, padding:'1px 6px', borderRadius:'var(--r-sm)',
                      fontFamily:'var(--font-mono)', letterSpacing:'0.04em',
                      background: run.status === 'COMPLETED' ? 'var(--green-d)'
                        : run.status === 'FAILED' ? 'var(--red-bg)'
                        : run.status === 'RUNNING' ? 'var(--gold-faint2)'
                        : 'rgba(255,255,255,0.04)',
                      color: run.status === 'COMPLETED' ? 'var(--green-b)'
                        : run.status === 'FAILED' ? '#e05a4e'
                        : run.status === 'RUNNING' ? 'var(--gold)'
                        : 'var(--txt-d)',
                    }}>
                      {run.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FOOTER INSET */}
          <div style={{ background:'var(--bg-f)', borderTop:'1px solid var(--rule)', padding:'10px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:10, color:'var(--txt-d)', fontFamily:'var(--font-mono)', letterSpacing:'0.06em' }}>
              SOUTHERN SHADE TECHNOLOGIES · HUB CERTIFIED · SAM.GOV REGISTERED
            </span>
            <span style={{ fontSize:10, color:'var(--txt-d)', fontFamily:'var(--font-mono)' }}>
              BIDOPS v1.0 · PHASE 1
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
