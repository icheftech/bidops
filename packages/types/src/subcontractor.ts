export type SubAvailabilityStatus = 'available' | 'partially_available' | 'unavailable' | 'unknown'

export interface Subcontractor {
  id: string
  tenantId: string
  companyName: string
  contactName: string | null
  email: string | null
  phone: string | null
  naicsCodes: string[]
  certifications: string[]
  domains: string[]
  hourlyRate: number | null
  dayRate: number | null
  availabilityStatus: SubAvailabilityStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}
