const CHANNEL_NAME = 'velvethive-auth'

type AuthBroadcastMessage = { type: 'LOGGED_IN' } | { type: 'LOGGED_OUT' }

// BroadcastChannel is same-origin only and per-browser (not per-tab), which is
// exactly the scope we want: every tab shares one httpOnly refresh cookie, so
// there is only ever one real session - this just keeps each tab's in-memory
// AuthContext state in sync with that shared session instead of only finding
// out on the next failed request or manual reload.
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null

export function broadcastLogin() {
  channel?.postMessage({ type: 'LOGGED_IN' } satisfies AuthBroadcastMessage)
}

export function broadcastLogout() {
  channel?.postMessage({ type: 'LOGGED_OUT' } satisfies AuthBroadcastMessage)
}

export function subscribeAuthBroadcast(handler: (message: AuthBroadcastMessage) => void) {
  if (!channel) return () => {}
  const listener = (event: MessageEvent<AuthBroadcastMessage>) => handler(event.data)
  channel.addEventListener('message', listener)
  return () => channel.removeEventListener('message', listener)
}
