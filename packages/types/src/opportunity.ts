export type OpportunityStatus =
  | 'new'
  | 'scoring'
  | 'scored'
  | 'pursuing'
  | 'passed'
  | 'expired'

export type SetAsideType =
  | 'total_small_business'
  | 'partial_small_business'
  | 'hub_zone'
  | 'sdvosb'
  | 'wosb'
  | 'hub' // Texas HUB
  | '8a'
  | 'none'
  | 'unknown'

export type OpportunityDomain =
  | 'ai_robotics'
  | 'it_staffing'
  | 'managed_it'
  | 'professional_services'
  | 'logistics'
  | 'other'

export type OpportunitySource =
  | 'sam_gov'
  | 'esbd_texas'
  | 'city_of_houston'
  | 'harris_county'
  | 'metro_harris'
  | 'hgac'
  | 'austin_finance'
  | 'demandstar'
  | 'ionwave'
  | 'euna'
  | 'opengov'
  | 'email_inbound'
  | 'manual'

export interface Opportunity {
  id: string
  tenantId: string
  source: OpportunitySource
  sourceId: string
  title: string
  description: string | null
  naicsCode: string | null
  pscCode: string | null
  domain: OpportunityDomain
  postedDate: Date | null
  dueDate: Date | null
  estimatedValue: number | null
  setAsideType: SetAsideType
  solicitationNumber: string | null
  agency: string | null
  officeAddress: string | null
  rawDocumentUrl: string | null
  status: OpportunityStatus
  score: number | null
  scoreReasoning: string | null
  hubApplicable: boolean
  catalogCoveragePercent: number | null
  createdAt: Date
  updatedAt: Date
}

export interface OpportunityScore {
  total: number
  breakdown: {
    hubSetAside: number
      esdbtexas: number
    smallBusinessSetAside: number
    naicsMatch: number
    localAgency: number
    belowThreshold: number
    pastPerformanceMatch: number
    compliancePenalty: number
  }
  recommendation: 'pursue' | 'pass' | 'monitor'
  confidence: number
  reasoning: string
  hubApplicable: boolean
  catalogCoveragePercent: number
  flags: string[]
}
