'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const DOMAINS = [
  { value: '',                   label: 'All Domains'   },
  { value: 'AI_ROBOTICS',        label: 'AI / Robotics' },
  { value: 'IT_STAFFING',        label: 'IT Staffing'   },
  { value: 'MANAGED_IT',         label: 'Managed IT'    },
  { value: 'PROFESSIONAL_SERVICES', label: 'Prof. Services' },
  { value: 'LOGISTICS',          label: 'Logistics'     },
  { value: 'OTHER',              label: 'Other'         },
]

const STATUSES = [
  { value: '',          label: 'All Statuses' },
  { value: 'NEW',       label: 'New'          },
  { value: 'SCORING',   label: 'Scoring'      },
  { value: 'SCORED',    label: 'Scored'       },
  { value: 'PURSUING',  label: 'Pursuing'     },
  { value: 'PASSED',    label: 'Passed'       },
  { value: 'EXPIRED',   label: 'Expired'      },
]

const SOURCES = [
  { value: '',             label: 'All Sources'    },
  { value: 'SAM_GOV',      label: 'SAM.gov'        },
  { value: 'ESBD_TEXAS',   label: 'ESBD Texas'     },
  { value: 'CITY_OF_HOUSTON', label: 'City of Houston' },
  { value: 'HARRIS_COUNTY',label: 'Harris County'  },
  { value: 'MANUAL',       label: 'Manual'         },
]

interface Props {
  searchParams: {
    domain?: string
    status?: string
    source?: string
    hub?:    string
    q?:      string
  }
}

export function OpportunityFilters({ searchParams }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams as Record<string, string>)
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  return (
    <div className="flex flex-wrap items-center gap-3">

      {/* Search */}
      <input
        type="text"
        defaultValue={searchParams.q ?? ''}
        placeholder="Search title, agency, solicitation #…"
        onKeyDown={e => { if (e.key === 'Enter') update('q', (e.target as HTMLInputElement).value) }}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-brand-400"
      />

      {/* Domain */}
      <select
        value={searchParams.domain ?? ''}
        onChange={e => update('domain', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>

      {/* Status */}
      <select
        value={searchParams.status ?? ''}
        onChange={e => update('status', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {/* Source */}
      <select
        value={searchParams.source ?? ''}
        onChange={e => update('source', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      {/* HUB toggle */}
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={searchParams.hub === 'true'}
          onChange={e => update('hub', e.target.checked ? 'true' : '')}
          className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
        />
        HUB only
      </label>
    </div>
  )
}
