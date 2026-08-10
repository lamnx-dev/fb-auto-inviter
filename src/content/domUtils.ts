/**
 * Resilient DOM Utilities for Facebook Business Suite Content Scripting
 */

export async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException("Aborted", "AbortError"))
    }
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException("Aborted", "AbortError"))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}

export function clickElement(
  el: HTMLElement,
  options: { skipScroll?: boolean } = {}
): void {
  if (!options.skipScroll) {
    try {
      el.scrollIntoView({ block: "nearest", behavior: "instant" })
    } catch {
      // Ignore scroll errors
    }
  }

  // Full React Synthetic Event Sequence: pointerdown -> mousedown -> mouseup -> click
  const events = ["pointerdown", "mousedown", "mouseup", "click"]

  for (const eventName of events) {
    const evt = new MouseEvent(eventName, {
      bubbles: true,
      cancelable: true,
      view: window,
      buttons: 1,
    })
    el.dispatchEvent(evt)
  }

  try {
    el.click()
  } catch {
    // Ignore direct click errors
  }
}

export function findByRole(
  role: string,
  container: ParentNode = document
): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(`[role="${role}"]`))
}

export async function waitUntil(
  predicate: () => boolean | Promise<boolean>,
  options: {
    timeoutMs?: number
    intervalMs?: number
    signal?: AbortSignal
  } = {}
): Promise<boolean> {
  const timeoutMs = options.timeoutMs ?? 5000
  const intervalMs = options.intervalMs ?? 500
  const signal = options.signal
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError")
    }

    const result = await predicate()
    if (result) return true

    await delay(intervalMs, signal)
  }

  return false
}

export async function waitForElement<T extends HTMLElement = HTMLElement>(
  finder: () => T | null | undefined | T[],
  options: {
    timeoutMs?: number
    intervalMs?: number
    signal?: AbortSignal
  } = {}
): Promise<T | null> {
  let foundElement: T | null = null

  const success = await waitUntil(async () => {
    const res = finder()
    if (Array.isArray(res)) {
      if (res.length > 0) {
        foundElement = res[0]
        return true
      }
    } else if (res) {
      foundElement = res
      return true
    }
    return false
  }, options)

  return success ? foundElement : null
}
