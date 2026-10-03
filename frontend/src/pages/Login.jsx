import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { homePathFor, useAuth } from '../context/AuthContext'
import { errorMessage } from '../services/api'
import { User, GraduationCap, Eye, EyeOff, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import ProjectTitle from '../components/ProjectTitle'
import DemoAccounts from '../components/DemoAccounts'
import Badge from '../components/Badge'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]       = useState('')
  const [busy, setBusy]         = useState(false)
  const [flash, setFlash]       = useState(false)
  const submitRef = useRef(null)

  if (user) return <Navigate to={homePathFor(user.role)} replace />

  // Demo account auto fill: set both fields, flash them, and focus Login so Enter submits
  const fillDemo = ({ email: demoEmail, password: demoPassword }) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setShowPassword(false)
    setError('')
    setFlash(true)
    setTimeout(() => setFlash(false), 800)
    submitRef.current?.focus()
  }

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
      {/* Project title banner - sits above the card */}
      <div className="fas-title-bar">
        <ProjectTitle />
      </div>

      <div className="fas-container">

        {/* ── Left: Form ── */}
        <div className="fas-form-box">
          <form onSubmit={submit} className="fas-form">
            <div className="fas-brand">
              <GraduationCap size={24} className="fas-brand-icon" />
              <h1>Sign In</h1>
            </div>
            <p className="fas-subtitle">Facial Recognition-Based Automated Students Attendance Monitoring System</p>

            {error && <div className="fas-error">{error}</div>}

            {/* Email */}
            <div className={`fas-input-box ${flash ? 'fas-flash' : ''}`}>
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
            <div className={`fas-input-box ${flash ? 'fas-flash' : ''}`}>
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

            <DemoAccounts current={{ email, password }} onFill={fillDemo} />

            <button id="login-submit" ref={submitRef} type="submit" className="fas-btn" disabled={busy}>
              <span className="fas-btn-label">
                {busy ? (
                  <><Loader2 size={17} className="fas-spin" /> Signing in…</>
                ) : (
                  <>Login <ArrowRight size={17} className="fas-btn-arrow" /></>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* ── Right: Animated face-scan panel ── */}
        <div className="fas-panel" aria-hidden="true">
          <div className="fas-orb fas-orb-1" />
          <div className="fas-orb fas-orb-2" />
          <div className="fas-grid" />

          <div className="fas-panel-content">
            <div className="fas-scanner-wrap">
              <span className="fas-pulse-ring" />
              <span className="fas-pulse-ring fas-pulse-ring-2" />

              <div className="fas-scanner">
                <span className="fas-corner fas-tl" />
                <span className="fas-corner fas-tr" />
                <span className="fas-corner fas-bl" />
                <span className="fas-corner fas-br" />

                <svg viewBox="0 0 120 130" className="fas-face" fill="none" stroke="currentColor"
                     strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="60" cy="62" rx="30" ry="40" />
                  <path d="M44 52 q5 -4 10 0" />
                  <path d="M66 52 q5 -4 10 0" />
                  <path d="M60 58 v14 q-4 3 -8 1" />
                  <path d="M47 86 q13 10 26 0" />
                  <path className="fas-mesh" d="M49 55 L71 55 L60 73 Z M47 86 L60 73 L73 86" />
                  <circle className="fas-dot" cx="49" cy="55" r="1.8" fill="currentColor" />
                  <circle className="fas-dot" cx="71" cy="55" r="1.8" fill="currentColor" style={{ animationDelay: '.2s' }} />
                  <circle className="fas-dot" cx="60" cy="73" r="1.8" fill="currentColor" style={{ animationDelay: '.4s' }} />
                  <circle className="fas-dot" cx="47" cy="86" r="1.8" fill="currentColor" style={{ animationDelay: '.6s' }} />
                  <circle className="fas-dot" cx="73" cy="86" r="1.8" fill="currentColor" style={{ animationDelay: '.8s' }} />
                </svg>

                <div className="fas-scanline" />
              </div>
            </div>

            <div className="fas-match">
              <CheckCircle2 size={15} /> Attendance marked
            </div>

            <h1>Hello, Welcome!</h1>
            <p>Automated attendance<br />powered by facial recognition</p>
          </div>
        </div>

      </div>

      {/* Credits badge - bottom-right corner */}
      <Badge />

      <style>{`
        .fas-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 88% 8%, rgba(99, 102, 241, .09), transparent 38%),
            radial-gradient(circle at 8% 92%, rgba(6, 182, 212, .09), transparent 38%),
            linear-gradient(135deg, #f8fafc 0%, #eef2f7 55%, #e5eaf1 100%);
          flex-direction: column;
          gap: 20px;
          padding: 24px 16px;
          box-sizing: border-box;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        .fas-title-bar {
          width: 940px;
          max-width: 100%;
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
        .fas-flash input { animation: fas-flash .8s ease; }
        @keyframes fas-flash {
          0%   { background: #e0e7ff; border-color: #4f46e5; box-shadow: 0 0 0 4px rgba(79,70,229,.22); }
          100% { background: #f1f5f9; border-color: transparent; box-shadow: 0 0 0 0 rgba(79,70,229,0); }
        }
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
          position: relative;
          overflow: hidden;
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: .2px;
          cursor: pointer;
          background: linear-gradient(120deg, #0f172a 0%, #312e81 55%, #4f46e5 100%);
          background-size: 200% 100%;
          background-position: 0% 0;
          box-shadow: 0 8px 22px rgba(79,70,229,.32), inset 0 1px 0 rgba(255,255,255,.18);
          transition: background-position .45s ease, transform .15s ease, box-shadow .2s ease;
        }
        /* light sweep across the button on hover */
        .fas-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 40%; height: 100%;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.38), transparent);
          transform: skewX(-20deg);
        }
        .fas-btn-label {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .fas-btn-arrow { transition: transform .2s ease; }
        .fas-btn:hover:not(:disabled) {
          background-position: 100% 0;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(79,70,229,.48), inset 0 1px 0 rgba(255,255,255,.25);
        }
        .fas-btn:hover:not(:disabled)::before { animation: fas-shine .8s ease; }
        .fas-btn:hover:not(:disabled) .fas-btn-arrow { transform: translateX(4px); }
        .fas-btn:active:not(:disabled) { transform: translateY(0) scale(.99); }
        /* Demo autofill focuses this button, so give it a gentle "ready" pulse */
        .fas-btn:focus-visible {
          outline: none;
          animation: fas-ready 1.6s ease-in-out infinite;
        }
        .fas-btn:disabled { opacity: .75; cursor: default; }
        .fas-spin { animation: fas-rotate .8s linear infinite; }
        @keyframes fas-shine  { to { left: 130%; } }
        @keyframes fas-rotate { to { transform: rotate(360deg); } }
        @keyframes fas-ready {
          0%, 100% { box-shadow: 0 8px 22px rgba(79,70,229,.32), 0 0 0 0 rgba(99,102,241,.55); }
          50%      { box-shadow: 0 8px 22px rgba(79,70,229,.32), 0 0 0 6px rgba(99,102,241,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fas-btn, .fas-btn-arrow { transition: none; }
          .fas-btn:hover:not(:disabled)::before, .fas-btn:focus-visible { animation: none; }
        }
        .fas-panel {
          position: relative;
          width: 50%;
          background: linear-gradient(145deg, #0b1020 0%, #1e1b4b 52%, #312e81 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 30px;
          box-sizing: border-box;
          text-align: center;
          overflow: hidden;
          isolation: isolate;
        }
        .fas-grid {
          position: absolute; inset: 0; z-index: -1;
          background-image:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 32px 32px;
          -webkit-mask-image: radial-gradient(circle at center, #000 25%, transparent 75%);
                  mask-image: radial-gradient(circle at center, #000 25%, transparent 75%);
        }
        .fas-orb {
          position: absolute; z-index: -1;
          border-radius: 50%;
          filter: blur(55px);
          opacity: .5;
        }
        .fas-orb-1 { width: 220px; height: 220px; background: #6366f1; top: -70px; right: -60px; animation: fas-float 10s ease-in-out infinite; }
        .fas-orb-2 { width: 200px; height: 200px; background: #06b6d4; bottom: -80px; left: -60px; animation: fas-float 12s ease-in-out infinite reverse; }
        @keyframes fas-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-24px, 28px) scale(1.15); }
        }

        .fas-panel-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        /* Scanner (the one hero element) */
        .fas-scanner-wrap {
          position: relative;
          width: 150px; height: 165px;
          margin-bottom: 10px;
        }
        .fas-pulse-ring {
          position: absolute; inset: 0;
          border-radius: 20px;
          border: 1.5px solid rgba(103,232,249,.55);
          animation: fas-ring 3.2s ease-out infinite;
        }
        .fas-pulse-ring-2 { animation-delay: 1.6s; }
        @keyframes fas-ring {
          0%   { transform: scale(1);   opacity: .7; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .fas-scanner {
          position: relative;
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          border-radius: 20px;
          background: rgba(255,255,255,.06);
          -webkit-backdrop-filter: blur(8px);
                  backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,.14);
          box-shadow: 0 0 40px rgba(99,102,241,.35), inset 0 0 30px rgba(255,255,255,.04);
          overflow: hidden;
        }
        .fas-face {
          width: 105px;
          color: #a5b4fc;
          filter: drop-shadow(0 0 6px rgba(129,140,248,.7));
        }
        .fas-dot {
          transform-box: fill-box;
          transform-origin: center;
          animation: fas-dot 1.6s ease-in-out infinite;
        }
        @keyframes fas-dot {
          0%, 100% { opacity: .35; transform: scale(.8); }
          50%      { opacity: 1;   transform: scale(1.6); }
        }
        .fas-mesh {
          stroke: #67e8f9; stroke-width: 1; stroke-dasharray: 3 3;
          opacity: .85;
          animation: fas-dash 1.2s linear infinite;
        }
        @keyframes fas-dash { to { stroke-dashoffset: -12; } }

        .fas-scanline {
          position: absolute; left: 0; right: 0; top: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #67e8f9, transparent);
          box-shadow: 0 0 14px 4px rgba(103,232,249,.55);
          animation: fas-scan 3.2s ease-in-out infinite;
        }
        @keyframes fas-scan {
          0%   { top: 4%;  opacity: 0; }
          10%  { opacity: 1; }
          50%  { top: 96%; }
          90%  { opacity: 1; }
          100% { top: 4%;  opacity: 0; }
        }

        .fas-corner { position: absolute; width: 20px; height: 20px; border: 2.5px solid #67e8f9; }
        .fas-tl { top: 8px;    left: 8px;  border-right: 0; border-bottom: 0; border-top-left-radius: 8px; }
        .fas-tr { top: 8px;    right: 8px; border-left: 0;  border-bottom: 0; border-top-right-radius: 8px; }
        .fas-bl { bottom: 8px; left: 8px;  border-right: 0; border-top: 0;    border-bottom-left-radius: 8px; }
        .fas-br { bottom: 8px; right: 8px; border-left: 0;  border-top: 0;    border-bottom-right-radius: 8px; }

        /* Result badge appears at the end of each scan */
        .fas-match {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12.5px; font-weight: 600;
          color: #6ee7b7;
          background: rgba(16,185,129,.14);
          border: 1px solid rgba(110,231,183,.35);
          padding: 5px 12px;
          border-radius: 999px;
          animation: fas-match 3.2s ease-in-out infinite;
        }
        @keyframes fas-match {
          0%, 45%  { opacity: 0; transform: translateY(6px) scale(.95); }
          60%, 88% { opacity: 1; transform: translateY(0) scale(1); }
          100%     { opacity: 0; transform: translateY(-4px) scale(.98); }
        }

        .fas-panel h1 {
          font-size: 30px;
          font-weight: 700;
          color: #fff;
          margin: 8px 0 0;
        }
        .fas-panel p {
          font-size: 14px;
          color: rgba(255,255,255,.75);
          margin: 0;
          line-height: 1.6;
        }

        @media (prefers-reduced-motion: reduce) {
          .fas-orb, .fas-pulse-ring, .fas-dot, .fas-mesh, .fas-scanline, .fas-match { animation: none; }
          .fas-pulse-ring { display: none; }
          .fas-match { opacity: 1; }
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