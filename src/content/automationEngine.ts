import { getSession, setSession } from "../shared/session"
import type { AutomationSession } from "../shared/types"
import { delay, waitForElement, waitUntil } from "./domUtils"
import {
  detectRateLimit,
  findInviteButton,
  findInviteDialog,
  getSelectableUsers,
  selectUsers,
  sendInvitations,
} from "./inviteController"

export class AutomationEngine {
  private static instance: AutomationEngine
  private session: AutomationSession = {
    running: false,
    lastSentAt: null,
  }
  private abortController: AbortController | null = null

  private constructor() {
    this.syncSessionFromStorage()
  }

  public static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine()
    }
    return AutomationEngine.instance
  }

  private async syncSessionFromStorage(): Promise<void> {
    try {
      this.session = await getSession()
    } catch {
      // Storage fallback
    }
  }

  private async updateSession(
    patch: Partial<AutomationSession>
  ): Promise<void> {
    this.session = {
      ...this.session,
      ...patch,
    }

    try {
      await setSession(this.session)
    } catch {
      // Storage fallback
    }
  }

  public getSession(): AutomationSession {
    return { ...this.session }
  }

  public async start(): Promise<{ success: boolean; error?: string }> {
    if (this.session.running) {
      return { success: true }
    }

    this.abortController = new AbortController()
    const signal = this.abortController.signal

    await this.updateSession({ running: true })

    try {
      await this.runLoop(signal)
      return { success: true }
    } catch (err) {
      await this.updateSession({ running: false })
      const isAbort = err instanceof DOMException && err.name === "AbortError"
      if (isAbort) return { success: true }

      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message }
    }
  }

  public async stop(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
    await this.updateSession({ running: false })
  }

  private async runLoop(signal: AbortSignal): Promise<void> {
    while (this.session.running && !signal.aborted) {
      const inviteBtn = findInviteButton()

      if (!inviteBtn) {
        throw new Error('Vui lòng cuộn xuống tìm nút "Gửi lời mời"')
      }

      inviteBtn.click()

      const dialog = await waitForElement<HTMLElement>(
        () => findInviteDialog(),
        {
          signal,
        }
      )

      if (!dialog) {
        throw new Error("Không tìm thấy hộp thoại mời")
      }

      let isLimited = false

      await waitUntil(
        () => {
          if (detectRateLimit()) {
            isLimited = true
            return true
          }
          return getSelectableUsers(dialog).length > 0
        },
        { signal }
      )

      if (isLimited) {
        throw new Error("Bạn đã đạt đến giới hạn")
      }

      const selectableUsers = getSelectableUsers(dialog)

      if (selectableUsers.length === 0) {
        await this.updateSession({ running: false })
        return
      }

      const selectedCount = selectUsers(selectableUsers)

      if (selectedCount === 0) {
        await this.updateSession({ running: false })
        return
      }

      await delay(500, signal)
      await sendInvitations(signal)

      await this.updateSession({ lastSentAt: Date.now() })

      await delay(2000, signal)
    }
  }
}

export const automationEngine = AutomationEngine.getInstance()
