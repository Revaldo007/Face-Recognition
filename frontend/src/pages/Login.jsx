import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { homePathFor, useAuth } from '../context/AuthContext'
import { errorMessage } from '../services/api'
import { User, GraduationCap, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const me = await login(email.trim(), password)
      navigate(homePathFor(me.role), { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Login failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fas-wrapper">
      <div className="fas-container">

        {/* ── Left: Form ── */}
        <div className="fas-form-box">
          <form onSubmit={submit} className="fas-form">
            <div className="fas-brand">
              <GraduationCap size={24} className="fas-brand-icon" />
              <h1>Sign In</h1>
            </div>
            <p className="fas-subtitle">Face Attendance System</p>

            {error && <div className="fas-error">{error}</div>}

            {/* Email */}
            <div className="fas-input-box">
              <input
                id="login-email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <User size={17} className="fas-icon" />
            </div>

            {/* Password */}
            <div className="fas-input-box">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                id="toggle-password"
                className="fas-icon fas-icon-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <div className="fas-hint">
              <p><b>Demo:</b> admin@college.edu / Admin@123</p>
            </div>

            <button id="login-submit" type="submit" className="fas-btn" disabled={busy}>
              {busy ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </div>

        {/* ── Right: Decorative panel ── */}
        <div className="fas-panel">
          <div className="fas-panel-content">
            <span className="fas-panel-emoji">🎓</span>
            <h1>Hello, Welcome!</h1>
            <p>Automated attendance<br />powered by facial recognition</p>
          </div>
        </div>

      </div>

      <style>{`
        .fas-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%);
          padding: 16px;
          box-sizing: border-box;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        .fas-container {
          display: flex;
          width: 860px;
          max-width: 100%;
          min-height: 540px;
          background: #ffffff;
          border-radius: 28px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, .14);
          overflow: hidden;
        }
        .fas-form-box {
          width: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          box-sizing: border-box;
        }
        .fas-form { width: 100%; text-align: center; }
        .fas-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .fas-brand-icon { color: #0f172a; }
        .fas-brand h1 {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .fas-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 20px;
        }
        .fas-error {
          font-size: 13px;
          color: #b91c1c;
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 9px 13px;
          border-radius: 9px;
          margin-bottom: 14px;
          text-align: left;
        }
        .fas-input-box {
          position: relative;
          margin-bottom: 16px;
          text-align: left;
        }
        .fas-input-box input {
          width: 100%;
          padding: 13px 44px 13px 16px;
          background: #f1f5f9;
          border: 1.5px solid transparent;
          border-radius: 10px;
          outline: none;
          font-size: 14.5px;
          color: #0f172a;
          font-weight: 500;
          box-sizing: border-box;
          transition: border-color .15s, background .15s, box-shadow .15s;
        }
        .fas-input-box input:focus {
          background: #fff;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79,70,229,.1);
        }
        .fas-input-box input::placeholder { color: #94a3b8; font-weight: 400; }
        .fas-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }
        .fas-icon-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          pointer-events: auto;
          display: flex;
          align-items: center;
          transition: color .15s;
        }
        .fas-icon-btn:hover { color: #475569; }
        .fas-hint { margin: -4px 0 14px; text-align: left; }
        .fas-hint p { font-size: 12.5px; color: #64748b; margin: 0; }
        .fas-btn {
          width: 100%;
          height: 46px;
          background: #0f172a;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(15,23,42,.18);
          transition: background .15s, transform .1s;
        }
        .fas-btn:hover:not(:disabled) {
          background: #1e293b;
          transform: translateY(-1px);
        }
        .fas-btn:active:not(:disabled) { transform: translateY(0); }
        .fas-btn:disabled { opacity: .6; cursor: default; }
        .fas-panel {
          width: 50%;
          background-image:
            linear-gradient(135deg, rgba(15,23,42,.78), rgba(79,70,229,.65)),
            url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80');
          background-size: cover;
          background-position: center;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 30px;
          box-sizing: border-box;
          text-align: center;
        }
        .fas-panel-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .fas-panel-emoji { font-size: 52px; line-height: 1; }
        .fas-panel h1 {
          font-size: 30px;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }
        .fas-panel p {
          font-size: 14px;
          color: rgba(255,255,255,.75);
          margin: 0;
          line-height: 1.6;
        }
        @media (max-width: 650px) {
          .fas-container { flex-direction: column; }
          .fas-form-box, .fas-panel { width: 100%; }
          .fas-panel { min-height: 170px; }
        }
        @media (max-width: 400px) {
          .fas-form-box { padding: 28px 20px; }
        }
      `}</style>
    </div>
  )
}
