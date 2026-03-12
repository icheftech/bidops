export type AgentType =
  | 'sourcing'
  | 'scoring'
  | 'pricing'
  | 'compliance'
  | 'narrative'
  | 'assembly'

export type AgentRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface AgentRun {
  id: string
  tenantId: string
  bidId: string | null
  opportunityId: string | null
  agentType: AgentType
  status: AgentRunStatus
  inputPayload: Record<string, unknown>
  outputPayload: Record<string, unknown> | null
  llmCalls: number
  tokensUsed: number
  costUsd: number
  startedAt: Date
  completedAt: Date | null
  error: string | null
}
