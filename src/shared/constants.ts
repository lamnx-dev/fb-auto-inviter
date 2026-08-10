import type { AutomationConfig } from "./types"

export const BUSINESS_SUITE_ORIGIN = "https://business.facebook.com"
export const BUSINESS_SUITE_HOME_URL = `${BUSINESS_SUITE_ORIGIN}/latest/home`
export const BUSINESS_SUITE_URL_PATTERN = `${BUSINESS_SUITE_ORIGIN}/*`

export const DEFAULT_CONFIG: AutomationConfig = {
  batchSize: 100,
}

export const DICTIONARY = {
  INVITE_BUTTON_TEXTS: ["gửi lời mời"],
  SEND_BUTTON_TEXTS: ["gửi lời mời"],
  RATE_LIMIT_TEXTS: ["bạn đã đạt đến giới hạn"],
}

export const STORAGE_KEYS = {
  SESSION: "fb_invite_manager_session",
} as const
