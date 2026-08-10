import { Button } from "@/components/ui/button"
import { ExternalLink, HelpCircle, Play, Square } from "lucide-react"
import { useEffect, useState } from "react"
import { BUSINESS_SUITE_HOME_URL } from "../shared/constants"
import type { AutomationSession } from "../shared/types"

const initialSession: AutomationSession = {
  running: false,
  lastSentAt: null,
  error: null,
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

function formatLastSent(timestamp: number | null): string {
  if (!timestamp) return "Chưa gửi lần nào"
  const date = new Date(timestamp)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${hours}:${minutes} ${day}/${month}`
}

export default function App() {
  const [session, setSession] = useState<AutomationSession>(initialSession)
  const [showGuide, setShowGuide] = useState(false)

  const fetchStatus = () => {
    if (typeof chrome === "undefined" || !chrome.runtime) return

    chrome.runtime.sendMessage(
      { type: "GET_STATUS" },
      (response: AutomationSession) => {
        if (response) setSession(response)
      }
    )
  }

  useEffect(() => {
    fetchStatus()

    const messageListener = (msg: { type: string; payload?: unknown }) => {
      if (msg.type === "STATUS_CHANGED" && msg.payload) {
        setSession(msg.payload as AutomationSession)
      }
    }

    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(messageListener)
    }

    return () => {
      if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.removeListener(messageListener)
      }
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage({ type: "CLEAR_ERROR" }).catch(() => {})
      }
    }
  }, [])

  const handleStart = () => {
    chrome.runtime.sendMessage({ type: "START_AUTOMATION" }, () =>
      fetchStatus()
    )
  }

  const handleStop = () => {
    chrome.runtime.sendMessage({ type: "STOP_AUTOMATION" }, () => fetchStatus())
  }

  const isOverdue =
    !session.lastSentAt ||
    Date.now() - session.lastSentAt >= TWENTY_FOUR_HOURS_MS

  return (
    <div className="flex w-72 flex-col overflow-hidden bg-background text-foreground antialiased">
      {/* Header with Logo & Icon Buttons */}
      <div className="flex items-center justify-between border-b border-border bg-background px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="FB Invite Manager Logo"
            className="h-8 w-8 rounded-lg border border-border object-contain shadow-xs"
          />
          <div>
            <h1 className="text-sm leading-tight font-semibold text-foreground">
              FB Invite Manager
            </h1>
            <p className="text-xs text-muted-foreground">
              {formatLastSent(session.lastSentAt)}
              {isOverdue && session.lastSentAt ? " · >24h" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGuide((prev) => !prev)}
            title="Hướng dẫn sử dụng"
            aria-label="Hướng dẫn sử dụng"
          >
            <HelpCircle className="text-muted-foreground hover:text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            title="Mở Facebook Business Suite"
          >
            <a
              href={BUSINESS_SUITE_HOME_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Mở Facebook Business Suite"
            >
              <ExternalLink className="text-muted-foreground hover:text-foreground" />
            </a>
          </Button>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="p-3.5">
        {session.running ? (
          <Button
            size="lg"
            variant="destructive"
            onClick={handleStop}
            aria-label="Dừng Automation"
            className="w-full"
          >
            <Square className="fill-white" />
            <span>Dừng Automation</span>
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleStart}
            aria-label="Bắt đầu Automation"
            className="w-full"
          >
            <Play className="fill-current" />
            <span>Bắt đầu</span>
          </Button>
        )}
        {session.error && (
          <p className="mt-2 text-xs text-destructive">{session.error}</p>
        )}
      </div>

      {/* Guideline section */}
      {showGuide && (
        <div className="border-t border-border bg-muted/40 px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">Hướng dẫn sử dụng:</p>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              Mở trang{" "}
              <a
                href={BUSINESS_SUITE_HOME_URL}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary underline hover:text-primary/80"
              >
                Facebook Business Suite
              </a>
            </li>
            <li>
              Cuộn xuống tìm nút{" "}
              <span className="font-semibold text-foreground">
                "Gửi lời mời"
              </span>
            </li>
            <li>
              Nhấn nút{" "}
              <span className="font-semibold text-foreground">"Bắt đầu"</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  )
}
