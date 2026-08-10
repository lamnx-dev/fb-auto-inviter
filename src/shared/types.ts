export interface AutomationSession {
  running: boolean
  lastSentAt: number | null
  error: string | null
}

export interface AutomationConfig {
  batchSize: number
}

export type ExtensionMessage =
  | { type: "GET_STATUS" }
  | { type: "START_AUTOMATION" }
  | { type: "STOP_AUTOMATION" }
  | { type: "STATUS_CHANGED"; payload: AutomationSession }
  | { type: "CLEAR_ERROR" }
