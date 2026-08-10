import {
  BUSINESS_SUITE_ORIGIN,
  BUSINESS_SUITE_URL_PATTERN,
  STORAGE_KEYS,
} from "../shared/constants"
import type { AutomationSession, ExtensionMessage } from "../shared/types"

const initialSession: AutomationSession = {
  running: false,
  lastSentAt: null,
  error: null,
}

let currentSession: AutomationSession = { ...initialSession }

// Initialize session state from storage
chrome.storage.local.get([STORAGE_KEYS.SESSION], (result) => {
  const storedSession = result[STORAGE_KEYS.SESSION] as
    Partial<AutomationSession> | undefined
  if (storedSession && typeof storedSession === "object") {
    currentSession = { ...initialSession, ...storedSession }
  }
})

async function saveSession(session: AutomationSession): Promise<void> {
  currentSession = session
  await chrome.storage.local.set({ [STORAGE_KEYS.SESSION]: session })
}

// Service worker message listener
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    const handleMessage = async () => {
      switch (message.type) {
        case "GET_STATUS": {
          sendResponse(currentSession)
          break
        }

        case "START_AUTOMATION": {
          const [activeTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          })

          const isBusinessSuite =
            activeTab?.url && activeTab.url.startsWith(BUSINESS_SUITE_ORIGIN)

          if (!isBusinessSuite || !activeTab?.id) {
            await saveSession({
              ...currentSession,
              running: false,
              error: "Vui lòng mở trang Facebook Business Suite",
            })
            sendResponse({ success: false, error: "Not on Business Suite" })
            break
          }

          try {
            await chrome.tabs.sendMessage(activeTab.id, {
              type: "START_AUTOMATION",
            })
            sendResponse({ success: true })
          } catch {
            await saveSession({
              ...currentSession,
              running: false,
              error: "Vui lòng làm mới trang (F5) và thử lại",
            })
            sendResponse({ success: false, error: "Content script not ready" })
          }
          break
        }

        case "STOP_AUTOMATION": {
          const updatedSession: AutomationSession = {
            ...currentSession,
            running: false,
          }
          await saveSession(updatedSession)

          const tabs = await chrome.tabs.query({
            url: BUSINESS_SUITE_URL_PATTERN,
          })
          for (const tab of tabs) {
            if (tab.id) {
              chrome.tabs
                .sendMessage(tab.id, { type: "STOP_AUTOMATION" })
                .catch(() => {})
            }
          }
          sendResponse({ success: true })
          break
        }

        case "STATUS_CHANGED": {
          await saveSession(message.payload)
          sendResponse({ success: true })
          break
        }

        case "CLEAR_ERROR": {
          await saveSession({ ...currentSession, error: null })
          sendResponse({ success: true })
          break
        }
      }
    }

    handleMessage()
    return true
  }
)
