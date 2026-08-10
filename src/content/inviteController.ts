import { DEFAULT_CONFIG, DICTIONARY } from "../shared/constants"
import { delay, findByRole, waitUntil } from "./domUtils"

export function findInviteButton() {
  const exactSurfaceBtn = document.querySelectorAll<HTMLElement>(
    '[data-surface*="audience_growth_card_info_row_button"]'
  )

  return Array.from(exactSurfaceBtn).findLast((btn) => {
    const text = btn.textContent?.toLowerCase().trim() || ""
    return DICTIONARY.INVITE_BUTTON_TEXTS.includes(text)
  })
}

export function isInviteDialog(element: HTMLElement): boolean {
  if (!element || element.getAttribute("role") !== "dialog") {
    return false
  }

  const textContent = element.textContent?.toLowerCase() || ""

  const hasInviteKeyword = DICTIONARY.INVITE_BUTTON_TEXTS.some((kw) =>
    textContent.includes(kw)
  )
  const hasCheckboxes =
    element.querySelectorAll('input[type="checkbox"], [aria-checked]').length >
    0

  return hasInviteKeyword || hasCheckboxes
}

export function findInviteDialog(): HTMLElement | null {
  const dialogs = findByRole("dialog")

  if (dialogs.length === 0) return null

  for (const dialog of dialogs) {
    if (isInviteDialog(dialog)) {
      return dialog
    }
  }

  return null
}

export function getSelectableUsers(dialog: HTMLElement): HTMLElement[] {
  const selector =
    'input[type="checkbox"][name="select user"], input[type="checkbox"][aria-label], [role="checkbox"][aria-label], input[type="checkbox"]'
  let inputs = Array.from(dialog.querySelectorAll<HTMLElement>(selector))

  if (inputs.length === 0) {
    inputs = Array.from(document.querySelectorAll<HTMLElement>(selector))
  }

  return inputs
}

export function selectUsers(users: HTMLElement[]): number {
  // Synchronous batch selection (< 5 milliseconds for 100 users)
  let selectedCount = 0
  const targetBatch = users.slice(0, DEFAULT_CONFIG.batchSize)

  for (const userCb of targetBatch) {
    const isChecked =
      (userCb as HTMLInputElement).checked ||
      userCb.getAttribute("aria-checked") === "true"

    if (!isChecked) {
      if (userCb instanceof HTMLInputElement) {
        userCb.checked = true
        userCb.dispatchEvent(new Event("change", { bubbles: true }))
        userCb.dispatchEvent(new Event("click", { bubbles: true }))
      } else {
        userCb.click()
      }
    }
    selectedCount++
  }

  return selectedCount
}

export async function sendInvitations(signal: AbortSignal): Promise<void> {
  const sendBtn = document.querySelector<HTMLElement>(
    '[data-surface*="kit_audience_growth_send_invite_button"], [data-surface*="send_invite_button"], [data-surface*="send_invite"]'
  )

  if (!sendBtn) {
    throw new Error('Không tìm thấy nút "Gửi lời mời"')
  }

  const success = await waitUntil(
    () => {
      const disabledAttr = sendBtn.getAttribute("aria-disabled")
      const isDisabled =
        disabledAttr === "true" || (sendBtn as HTMLButtonElement).disabled
      return !isDisabled
    },
    { signal }
  )

  if (!success) {
    throw new Error('Nút "Gửi lời mời" bị vô hiệu hóa')
  }

  // Single precise click to prevent duplicate request submissions
  sendBtn.click()

  await delay(1000, signal)

  // Handle potential 24h limit secondary confirmation card ("Send 100 invites?")
  const confirmBtn = document.querySelector<HTMLElement>(
    '[data-surface*="growth_invite_limit_confirmation_card_button"]'
  )

  if (confirmBtn) {
    confirmBtn.click()
  }
}

export function detectRateLimit(targetElement?: HTMLElement | null): boolean {
  const container = targetElement || document.body
  const text = container.textContent?.toLowerCase() || ""

  return DICTIONARY.RATE_LIMIT_TEXTS.some((kw) => text.includes(kw))
}
