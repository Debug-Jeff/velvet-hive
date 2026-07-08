// In-memory only, deliberately never persisted (localStorage/sessionStorage) to
// reduce XSS blast radius - matches the backend's access-token design intent.
let accessToken: string | null = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
}
