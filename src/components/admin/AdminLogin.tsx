import { useState } from 'react'
import './AdminLogin.css'

interface Props {
  onSuccess: () => void
}

export default function AdminLogin({ onSuccess }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        sessionStorage.setItem('adminPwd', password)
        onSuccess()
      } else {
        setError('Incorrect password.')
      }
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="al-wrap">
      <div className="al-card">
        <div className="al-brand">
          <h1>Velvet Hive</h1>
          <p>Admin Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="al-form">
          <label className="al-label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />
          {error && <p className="al-error">{error}</p>}
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading || !password}>
            {loading ? 'Verifying…' : 'Sign in'}
          </button>
        </form>
        <p className="al-back">
          <a href="/" onClick={e => { e.preventDefault(); window.location.href = '/' }}>← Back to store</a>
        </p>
      </div>
    </div>
  )
}
