import { useState } from 'react'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('adminPwd'))

  const handleLogout = () => {
    sessionStorage.removeItem('adminPwd')
    setAuthed(false)
  }

  return authed
    ? <AdminDashboard onLogout={handleLogout} />
    : <AdminLogin onSuccess={() => setAuthed(true)} />
}
