import type { AutomationSession } from "./types"

export const DEFAULT_SESSION = {
  running: false,
  lastSentAt: null,
} as const satisfies AutomationSession

export async function getSession(): Promise<AutomationSession> {
  const items = await chrome.storage.local.get(DEFAULT_SESSION)
  return items as unknown as AutomationSession
}

export async function setSession(
  session: Partial<AutomationSession>
): Promise<void> {
  await chrome.storage.local.set(session)
}
