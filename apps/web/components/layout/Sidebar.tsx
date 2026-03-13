'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarCounts {
  all: number; pursuing: number; scored: number; newCount: number; passed: number
  aiRobotics: number; itStaffing: number; managedIt: number; profServices: number; logistics: number
  samGov: number; esbd: number; cityHouston: number; harrisCounty: number; demandStar: number
}

interface Props { counts?: Partial<SidebarCounts> }

function Ct({ n, v }: { n?: number; v?: 'gold' | 'green' }) {
  return <span className={`sb-count${v ? ` ${v}` : ''}`}>{n ?? 0}</span>
}

export default function Sidebar({ counts = {} }: Props) {
  const path = usePathname()
  const a = (href: string) => path === href || path.startsWith(href + '?') ? ' active' : ''

  return (
    <aside className="sidebar">
      <div className="sb-section">Pipeline</div>
      <Link href="/opportunities" className={`sb-item${a('/opportunities')}`}>All Opportunities <Ct n={counts.all} v="gold" /></Link>
      <Link href="/opportunities?status=PURSUING" className="sb-item">Pursuing <Ct n={counts.pursuing} v="gold" /></Link>
      <Link href="/opportunities?status=SCORED"   className="sb-item">Scored   <Ct n={counts.scored} /></Link>
      <Link href="/opportunities?status=NEW"      className="sb-item">New      <Ct n={counts.newCount} /></Link>
      <Link href="/opportunities?status=PASSED"   className="sb-item">Passed   <Ct n={counts.passed} /></Link>

      <div className="sb-section" style={{ marginTop:10 }}>Domains</div>
      <Link href="/opportunities?domain=AI_ROBOTICS"            className="sb-item">AI &amp; Robotics    <Ct n={counts.aiRobotics}   v="green" /></Link>
      <Link href="/opportunities?domain=IT_STAFFING"            className="sb-item">IT Staffing          <Ct n={counts.itStaffing} /></Link>
      <Link href="/opportunities?domain=MANAGED_IT"             className="sb-item">Managed IT           <Ct n={counts.managedIt} /></Link>
      <Link href="/opportunities?domain=PROFESSIONAL_SERVICES"  className="sb-item">Prof. Services       <Ct n={counts.profServices} /></Link>
      <Link href="/opportunities?domain=LOGISTICS"              className="sb-item">Logistics            <Ct n={counts.logistics} /></Link>

      <div className="sb-section" style={{ marginTop:10 }}>Sources</div>
      <Link href="/opportunities?source=SAM_GOV"        className="sb-item">SAM.gov        <Ct n={counts.samGov} /></Link>
      <Link href="/opportunities?source=ESBD_TEXAS"     className="sb-item">ESBD Texas     <Ct n={counts.esbd} v="green" /></Link>
      <Link href="/opportunities?source=CITY_OF_HOUSTON" className="sb-item">City of Houston <Ct n={counts.cityHouston} /></Link>
      <Link href="/opportunities?source=HARRIS_COUNTY"  className="sb-item">Harris County  <Ct n={counts.harrisCounty} /></Link>
      <Link href="/opportunities?source=DEMANDSTAR"     className="sb-item">DemandStar     <Ct n={counts.demandStar} /></Link>
    </aside>
  )
}
