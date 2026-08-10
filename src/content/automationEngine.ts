import { STORAGE_KEYS } from "../shared/constants"
import type { AutomationSession } from "../shared/types"
import { clickElement, delay, waitForElement, waitUntil } from "./domUtils"
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
    error: null,
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
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        const data = await chrome.storage.local.get(STORAGE_KEYS.SESSION)
        const stored = data[STORAGE_KEYS.SESSION] as
          Partial<AutomationSession> | undefined
        if (stored && typeof stored === "object") {
          this.session = { ...this.session, ...stored }
        }
      }
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
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        await chrome.runtime.sendMessage({
          type: "STATUS_CHANGED",
          payload: this.session,
        })
      }
    } catch {
      // Worker sleeping fallback
    }
  }

  public getSession(): AutomationSession {
    return { ...this.session }
  }

  public async start(): Promise<void> {
    if (this.session.running) {
      return
    }

    this.abortController = new AbortController()
    const signal = this.abortController.signal

    await this.updateSession({ running: true, error: null })

    try {
      await this.runLoop(signal)
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError"
      const message = isAbort
        ? null
        : err instanceof Error
          ? err.message
          : String(err)
      await this.updateSession({ running: false, error: message })
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
    let isFirstIteration = true

    while (this.session.running && !signal.aborted) {
      const inviteBtn = isFirstIteration
        ? findInviteButton()
        : await waitForElement<HTMLElement>(() => findInviteButton(), {
            signal,
          })
      isFirstIteration = false

      if (!inviteBtn) {
        throw new Error('Vui lòng cuộn xuống tìm nút "Gửi lời mời"')
      }

      clickElement(inviteBtn)

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
          if (detectRateLimit(dialog)) {
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
