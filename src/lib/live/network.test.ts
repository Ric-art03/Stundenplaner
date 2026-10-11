import { afterEach, describe, expect, it, vi } from 'vitest'
import { serverReachable } from './network'

function online(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  online(true)
})

describe('Ist der Server erreichbar?', () => {
  it('fragt gar nicht erst, wenn das Gerät kein Netz meldet', async () => {
    online(false)
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    expect(await serverReachable()).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('glaubt dem Gerät nicht allein: gefragt wird der Server', async () => {
    online(true)
    const fetch = vi.fn(async () => ({ ok: true }))
    vi.stubGlobal('fetch', fetch)

    expect(await serverReachable()).toBe(true)
    expect(fetch).toHaveBeenCalledWith(
      '/live-sw.js',
      expect.objectContaining({ method: 'HEAD', cache: 'no-store' })
    )
  })

  it('gilt als nicht erreichbar, wenn die Anfrage scheitert — WLAN ohne Internet', async () => {
    online(true)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      })
    )

    expect(await serverReachable()).toBe(false)
  })

  it('gilt als nicht erreichbar, wenn der Server einen Fehler meldet', async () => {
    online(true)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false }))
    )

    expect(await serverReachable()).toBe(false)
  })

  it('wartet nicht endlos: nach dem Zeitlimit wird abgebrochen', async () => {
    online(true)
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => reject(new DOMException('abgebrochen', 'AbortError')))
          })
      )
    )

    const result = serverReachable(4000)
    await vi.advanceTimersByTimeAsync(4000)
    expect(await result).toBe(false)
  })
})
