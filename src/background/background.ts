import { BUSINESS_SUITE_URL_PATTERN } from "../shared/constants"
import { setSession } from "../shared/session"
import type { ExtensionMessage } from "../shared/types"

// Service worker message listener
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    const handleMessage = async () => {
      switch (message.type) {
        case "START_AUTOMATION": {
          const [activeTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          })

          if (!activeTab?.id) {
            sendResponse({
              success: false,
              error: "Không tìm thấy tab đang hoạt động",
            })
            break
          }

          if (activeTab.status !== "complete") {
            sendResponse({
              success: false,
              error: "Trang web đang tải, vui lòng đợi trang tải xong",
            })
            break
          }

          try {
            const res = await chrome.tabs.sendMessage(activeTab.id, {
              type: "START_AUTOMATION",
            })
            sendResponse(res)
          } catch {
            sendResponse({
              success: false,
              error: "Vui lòng làm mới trang (F5) và thử lại",
            })
          }
          break
        }

        case "STOP_AUTOMATION": {
          await setSession({ running: false })

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
      }
    }

    handleMessage()
    return true
  }
)
