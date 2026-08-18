import { waitForElement } from "./domUtils"

export function findInviteButton() {
  const btns = document.querySelectorAll<HTMLElement>(
    '[data-surface*="audience_growth_card_info_row_button"]'
  )
  return btns[1]
}

export function findInviteDialog(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[data-surface*="interaction_inviter_modal_inner"]'
  )
}

export function getSelectableUsers(dialog: HTMLElement): HTMLElement[] {
  return Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'input[type="checkbox"][name="select user"]'
    )
  )
}

export function selectUsers(users: HTMLElement[]): number {
  let selectedCount = 0

  for (const userCb of users) {
    const isChecked = userCb.getAttribute("aria-checked") === "true"

    if (!isChecked) {
      userCb.click()
    }
    selectedCount++
  }

  return selectedCount
}

export async function sendInvitations(signal: AbortSignal): Promise<void> {
  const sendBtn = await waitForElement<HTMLElement>(
    () =>
      document.querySelector<HTMLElement>(
        '[data-surface*="kit_audience_growth_send_invite_button"]'
      ),
    {
      timeoutMs: 2000,
      signal,
    }
  )

  if (!sendBtn) {
    throw new Error('Không tìm thấy nút "Gửi lời mời"')
  }

  sendBtn.click()

  // Handle potential 24h limit secondary confirmation card ("Send 100 invites?")
  const confirmBtn = await waitForElement<HTMLElement>(
    () =>
      document.querySelector<HTMLElement>(
        '[data-surface*="growth_invite_limit_confirmation_card_button"]'
      ),
    {
      timeoutMs: 1500,
      signal,
    }
  )

  if (confirmBtn) {
    confirmBtn.click()
  }
}

export function detectRateLimit(): boolean {
  return Boolean(
    document.querySelector(
      '[data-surface*="biz_kit_interaction_inviter_modal_inner"][data-surface*="GeoGuidanceCard"]'
    )
  )
}
