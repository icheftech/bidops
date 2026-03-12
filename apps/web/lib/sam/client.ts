import type { SamSearchParams, SamSearchResponse, SamOpportunity } from '@bidops/types'

const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search'

// Primary NAICS codes for BidOps tenant sourcing
export const BIDOPS_NAICS_CODES = [
  '541511', // Custom Computer Programming Services
  '541512', // Computer Systems Design Services
  '541519', // Other Computer Related Services
  '541715', // Research and Development in Physical, Engineering, and Life Sciences (AI/Robotics)
  '541513', // Computer Facilities Management Services
  '541611', // Admin Management and General Management Consulting
  '541990', // All Other Professional, Scientific, and Technical Services
  '561320', // Temporary Staffing Services
  '484110', // General Freight Trucking, Local
  '488510', // Freight Transportation Arrangement
  '493110', // General Warehousing and Storage
  '541614', // Process, Physical Distribution, and Logistics Consulting
]

// PSC codes for AI/Robotics — federal priority category
export const AI_ROBOTICS_PSC_CODES = [
  'D399', // IT and Telecom — Other IT and Telecommunications
  'R425', // Support- Professional: Engineering/Technical
  'D302', // IT and Telecom — Automated Information System Services
  'R408', // Support- Professional: Program Management/Support
]

export class SamGovClient {
  private apiKey: string

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.SAM_GOV_API_KEY
    if (!key) throw new Error('SAM_GOV_API_KEY is required')
    this.apiKey = key
  }

  async search(params: SamSearchParams): Promise<SamSearchResponse> {
    const url = new URL(SAM_BASE_URL)

    url.searchParams.set('api_key', this.apiKey)
    url.searchParams.set('limit', String(params.limit ?? 100))
    url.searchParams.set('offset', String(params.offset ?? 0))

    if (params.naicsCode)       url.searchParams.set('naicsCode', params.naicsCode)
    if (params.pscCode)         url.searchParams.set('pscCode', params.pscCode)
    if (params.postedFrom)      url.searchParams.set('postedFrom', params.postedFrom)
    if (params.postedTo)        url.searchParams.set('postedTo', params.postedTo)
    if (params.dueFrom)         url.searchParams.set('dueFrom', params.dueFrom)
    if (params.dueTo)           url.searchParams.set('dueTo', params.dueTo)
    if (params.typeOfSetAside)  url.searchParams.set('typeOfSetAside', params.typeOfSetAside)
    if (params.status)          url.searchParams.set('status', params.status)
    if (params.q)               url.searchParams.set('q', params.q)

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 }, // cache 1hr in Next.js
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`SAM.gov API error ${res.status}: ${error}`)
    }

    return res.json() as Promise<SamSearchResponse>
  }

  // Fetch all active AI/Robotics opportunities across primary PSC codes
  async fetchAIRoboticsOpportunities(): Promise<SamOpportunity[]> {
    const results: SamOpportunity[] = []
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    for (const pscCode of AI_ROBOTICS_PSC_CODES) {
      try {
        const response = await this.search({
          pscCode,
          postedFrom: thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '/'),
          status: 'active',
          limit: 100,
        })
        results.push(...(response.opportunitiesData ?? []))
      } catch (err) {
        console.error(`Failed fetching PSC ${pscCode}:`, err)
      }
    }

    return results
  }

  // Fetch opportunities by primary NAICS codes
  async fetchByNaics(naicsCodes: string[] = BIDOPS_NAICS_CODES): Promise<SamOpportunity[]> {
    const results: SamOpportunity[] = []
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    for (const naicsCode of naicsCodes) {
      try {
        const response = await this.search({
          naicsCode,
          postedFrom: thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '/'),
          status: 'active',
          limit: 100,
        })
        results.push(...(response.opportunitiesData ?? []))
      } catch (err) {
        console.error(`Failed fetching NAICS ${naicsCode}:`, err)
      }
    }

    return results
  }

  // Fetch HUB-zone and set-aside opportunities (federal small business set-asides)
  async fetchSetAsideOpportunities(): Promise<SamOpportunity[]> {
    const setAsides = ['SBA', 'SBP', 'HZC', 'HZS', 'WOSB', 'EDWOSB', '8A', '8AN']
    const results: SamOpportunity[] = []

    for (const setAside of setAsides) {
      try {
        const response = await this.search({
          typeOfSetAside: setAside,
          status: 'active',
          limit: 50,
        })
        // Filter to our NAICS codes
        const filtered = (response.opportunitiesData ?? []).filter(
          opp => opp.naicsCode && BIDOPS_NAICS_CODES.includes(opp.naicsCode)
        )
        results.push(...filtered)
      } catch (err) {
        console.error(`Failed fetching set-aside ${setAside}:`, err)
      }
    }

    return results
  }
}

export const samClient = new SamGovClient()
