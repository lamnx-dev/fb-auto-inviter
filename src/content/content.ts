import type { ExtensionMessage } from "../shared/types"
import { automationEngine } from "./automationEngine"

// Message handling from Extension Background / Popup
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    switch (message.type) {
      case "START_AUTOMATION": {
        automationEngine.start().then((result) => {
          sendResponse(result)
        })
        break
      }

      case "STOP_AUTOMATION": {
        automationEngine.stop()
        sendResponse({ success: true })
        break
      }
    }
    return true
  }
)
