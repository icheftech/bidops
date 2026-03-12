export type BidStatus =
  | 'draft'
  | 'cp1_pending'
  | 'cp1_approved'
  | 'cp1_rejected'
  | 'preparing'
  | 'cp2_pending'
  | 'cp2_approved'
  | 'cp2_rejected'
  | 'submitted'
  | 'awarded'
  | 'lost'
  | 'withdrawn'

export type BidDocType =
  | 'technical_narrative'
  | 'pricing_exhibit'
  | 'capability_statement'
  | 'past_performance'
  | 'government_forms'
  | 'cover_letter'
  | 'management_approach'
  | 'other'

export interface Bid {
  id: string
  tenantId: string
  opportunityId: string
  domain: string
  status: BidStatus
  autoQualified: boolean
  totalPrice: number | null
  cp1ApprovedAt: Date | null
  cp1ApproverId: string | null
  cp2ApprovedAt: Date | null
  cp2ApproverId: string | null
  submittedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface HitlCheckpoint {
  id: string
  tenantId: string
  bidId: string
  checkpointType: 'CP1' | 'CP2'
  status: 'pending' | 'approved' | 'rejected' | 'bypassed'
  briefingPayload: Record<string, unknown>
  reviewerId: string | null
  decisionAt: Date | null
  notes: string | null
  createdAt: Date
}
