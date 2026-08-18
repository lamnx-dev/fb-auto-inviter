export interface AutomationSession {
  running: boolean
  lastSentAt: number | null
}

export type ExtensionMessage =
  | { type: "START_AUTOMATION" }
  | { type: "STOP_AUTOMATION" }
