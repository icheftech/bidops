import type { SamOpportunity } from '@bidops/types'

// Map SAM.gov set-aside codes to our internal enum
const SET_ASIDE_MAP: Record<string, string> = {
  'SBA':    'TOTAL_SMALL_BUSINESS',
  'SBP':    'PARTIAL_SMALL_BUSINESS',
  'HZC':    'HUB_ZONE',
  'HZS':    'HUB_ZONE',
  'WOSB':   'WOSB',
  'EDWOSB': 'WOSB',
  '8A':     'EIGHT_A',
  '8AN':    'EIGHT_A',
  'SDVOSBC':'SDVOSB',
  'SDVOSBS':'SDVOSB',
}

// Map NAICS codes to our domain enum
const NAICS_TO_DOMAIN: Record<string, string> = {
  '541511': 'AI_ROBOTICS',
  '541512': 'AI_ROBOTICS',
  '541519': 'AI_ROBOTICS',
  '541715': 'AI_ROBOTICS',
  '541513': 'MANAGED_IT',
  '561320': 'IT_STAFFING',
  '541611': 'PROFESSIONAL_SERVICES',
  '541990': 'PROFESSIONAL_SERVICES',
  '484110': 'LOGISTICS',
  '488510': 'LOGISTICS',
  '493110': 'LOGISTICS',
  '541614': 'LOGISTICS',
}

// PSC codes that indicate AI/Robotics regardless of NAICS
const AI_PSC_CODES = new Set(['D399', 'D302', 'R425', 'R408'])

export function normalizeSamOpportunity(opp: SamOpportunity, tenantId: string) {
  const naicsCode = opp.naicsCode ?? null
  const pscCode = opp.classificationCode ?? null

  // Domain resolution: PSC takes priority for AI detection
  let domain = 'OTHER'
  if (pscCode && AI_PSC_CODES.has(pscCode)) {
    domain = 'AI_ROBOTICS'
  } else if (naicsCode && NAICS_TO_DOMAIN[naicsCode]) {
    domain = NAICS_TO_DOMAIN[naicsCode]
  }

  const setAsideCode = opp.typeOfSetAside ?? 'UNKNOWN'
  const setAsideType = SET_ASIDE_MAP[setAsideCode] ?? 'UNKNOWN'

  return {
    tenantId,
    source:            'SAM_GOV' as const,
    sourceId:          opp.noticeId,
    title:             opp.title,
    description:       opp.description,
    naicsCode,
    pscCode,
    domain,
    postedDate:        opp.postedDate ? new Date(opp.postedDate) : null,
    dueDate:           opp.responseDeadLine ? new Date(opp.responseDeadLine) : null,
    estimatedValue:    null, // SAM.gov doesn't consistently provide this
    setAsideType,
    solicitationNumber: opp.solicitationNumber,
    agency:            opp.fullParentPathName,
    officeAddress:     opp.officeAddress
                         ? `${opp.officeAddress.city}, ${opp.officeAddress.state}`
                         : null,
    rawDocumentUrl:    opp.uiLink,
    status:            'NEW' as const,
    hubApplicable:     false, // scored by scoring agent
    sourceList:        ['SAM_GOV'],
  }
}
