import { ExternalLink, HelpCircle, Play, Square } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

import {
  BUSINESS_SUITE_HOME_URL,
  BUSINESS_SUITE_ORIGIN,
} from "../shared/constants"
import { getSession } from "../shared/session"
import type { AutomationSession } from "../shared/types"

const initialSession: AutomationSession = {
  running: false,
  lastSentAt: null,
}

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
  const [isBusinessSuite, setIsBusinessSuite] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const checkTab = async () => {
      if (typeof chrome !== "undefined" && chrome.tabs?.query) {
        const [activeTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        })
        const onSuite = Boolean(
          activeTab?.url && activeTab.url.startsWith(BUSINESS_SUITE_ORIGIN)
        )
        if (isMounted) setIsBusinessSuite(onSuite)
      }
    }

    const updateState = async () => {
      const state = await getSession()
      if (isMounted) setSession(state)
      await checkTab()
    }

    updateState()

    const listener = async (
      _changes: unknown,
      areaName: chrome.storage.AreaName
    ) => {
      if (areaName === "local") {
        await updateState()
      }
    }

    chrome.storage.onChanged.addListener(listener)

    return () => {
      isMounted = false
      chrome.storage.onChanged.removeListener(listener)
    }
  }, [])

  const handleStart = () => {
    setError(null)
    chrome.runtime.sendMessage(
      { type: "START_AUTOMATION" },
      (res: { success?: boolean; error?: string } | undefined) => {
        if (res && !res.success && res.error) {
          setError(res.error)
        }
      }
    )
  }

  const handleStop = () => {
    setError(null)
    chrome.runtime.sendMessage({ type: "STOP_AUTOMATION" })
  }

  const appName = import.meta.env.VITE_APP_NAME

  return (
    <div className="flex w-72 flex-col overflow-hidden bg-background text-foreground antialiased">
      {/* Header with Logo & Icon Buttons */}
      <div className="flex items-center justify-between border-b border-border bg-background px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt={`${appName} Logo`}
            className="h-8 w-8 rounded-lg border border-border object-contain shadow-xs"
          />
          <div>
            <h1 className="text-sm leading-tight font-semibold text-foreground">
              {appName}
            </h1>
            <p className="text-xs text-muted-foreground">
              {formatLastSent(session.lastSentAt)}
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
        ) : !isBusinessSuite ? (
          <Button size="lg" asChild className="w-full">
            <a
              href={BUSINESS_SUITE_HOME_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Mở trang Facebook Business Suite"
            >
              <ExternalLink />
              <span>Mở trang Facebook Business Suite</span>
            </a>
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
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
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
