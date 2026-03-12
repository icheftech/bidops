export type TenantStatus = 'active' | 'suspended' | 'onboarding' | 'churned'

export interface Tenant {
  id: string
  name: string
  slug: string
  cageCode: string | null
  uei: string | null
  hubCertified: boolean
  hubExpiry: Date | null
  samExpiry: Date | null
  primaryNaics: string[]
  status: TenantStatus
  createdAt: Date
  updatedAt: Date
}
