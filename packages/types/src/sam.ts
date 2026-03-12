// SAM.gov API response types
export interface SamOpportunity {
  noticeId: string
  title: string
  solicitationNumber: string | null
  fullParentPathName: string | null
  fullParentPathCode: string | null
  postedDate: string
  type: string
  baseType: string
  archiveType: string
  archiveDate: string | null
  typeOfSetAsideDescription: string | null
  typeOfSetAside: string | null
  responseDeadLine: string | null
  naicsCode: string | null
  naicsHumanReadableDesc: string | null
  classificationCode: string | null
  active: string
  award: unknown | null
  description: string | null
  organizationType: string
  officeAddress: {
    zipcode: string
    city: string
    countryCode: string
    state: string
  } | null
  placeOfPerformance: unknown | null
  additionalInfoLink: string | null
  uiLink: string
  links: Array<{ rel: string; href: string }>
}

export interface SamSearchResponse {
  totalRecords: number
  limit: number
  offset: number
  opportunitiesData: SamOpportunity[]
}

export interface SamSearchParams {
  naicsCode?: string
  pscCode?: string
  postedFrom?: string
  postedTo?: string
  dueFrom?: string
  dueTo?: string
  typeOfSetAside?: string
  status?: string
  limit?: number
  offset?: number
  q?: string
}
