const PING_INTERVAL_MS = 3 * 60 * 1000 // every 3 minutes

export function startKeepAlive() {
  const baseUrl = process.env.RENDER_EXTERNAL_URL
  if (!baseUrl) return null

  const url = `${baseUrl}/api/health`

  async function ping() {
    try {
      const res = await fetch(url)
      if (!res.ok) console.warn(`Keep-alive ping got HTTP ${res.status}`)
    } catch (err) {
      console.warn('Keep-alive ping failed', err)
    }
  }

  return setInterval(ping, PING_INTERVAL_MS)
}
