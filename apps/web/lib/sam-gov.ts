/**
 * sam-gov.ts — convenience wrappers used by the ingest API route.
 * Delegates to lib/sam/client.ts and lib/sam/normalizer.ts.
 */

import { SamGovClient } from './sam/client'
import { normalizeSamOpportunity } from './sam/normalizer'
import type { SamOpportunity } from '@bidops/types'

export { normalizeSamOpportunity as transformSamOpportunity }

const client = new SamGovClient()

export interface ScanResult {
  opportunities: SamOpportunity[]
}

/** Scan AI/Robotics PSC codes — `days` controls the look-back window (unused by client, kept for signature compat) */
export async function scanAiRoboticsOpportunities(_days = 7): Promise<ScanResult> {
  const opportunities = await client.fetchAIRoboticsOpportunities()
  return { opportunities }
}

/** Scan Texas-relevant NAICS codes */
export async function scanTexasOpportunities(_days = 3): Promise<ScanResult> {
  const opportunities = await client.fetchByNaics()
  return { opportunities }
}

/** Scan HUB / set-aside opportunities */
export async function scanSetAsideOpportunities(_days = 7): Promise<ScanResult> {
  const opportunities = await client.fetchSetAsideOpportunities()
  return { opportunities }
}
