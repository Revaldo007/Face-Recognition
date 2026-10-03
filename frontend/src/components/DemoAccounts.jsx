import { ShieldCheck, BookOpen, Check, Zap } from 'lucide-react'

// Demo accounts shown under the login form. Click one to auto fill email + password.
export const DEMO_ACCOUNTS = [
  { role: 'Admin',   email: 'admin@college.edu',   password: 'Admin@123',   Icon: ShieldCheck },
  { role: 'Faculty', email: 'faculty@college.edu', password: 'Faculty@123', Icon: BookOpen },
]

/**
 * Props
 *  - onFill(account) : called with { role, email, password } when a card is clicked
 *  - current         : { email, password } currently typed in the form,
 *                      used to mark the matching card as "Filled"
 */
export default function DemoAccounts({ onFill, current = {} }) {
  return (
    <div className="da-wrap">
      <div className="da-head">
        <span className="da-rule" />
        <span className="da-title">Demo accounts</span>
        <span className="da-rule" />
      </div>

      <div className="da-list">
        {DEMO_ACCOUNTS.map(({ role, email, password, Icon }, i) => {
          const active = current.email === email && current.password === password
          return (
            <button
              key={role}
              type="button"
              id={`demo-${role.toLowerCase()}`}
              className={`da-card ${active ? 'da-active' : ''}`}
              style={{ animationDelay: `${0.15 + i * 0.1}s` }}
              onClick={() => onFill({ role, email, password })}
              aria-label={`Auto fill ${role} demo account`}
            >
              <span className="da-ico"><Icon size={17} /></span>

              <span className="da-meta">
                <b>{role}</b>
                <small>{email}</small>
              </span>

              <span className="da-pill">
                {active ? <><Check size={13} strokeWidth={3} /> Filled</> : <><Zap size={13} /> Auto fill</>}
              </span>
            </button>
          )
        })}
      </div>

      <style>{`
        .da-wrap { margin: 2px 0 16px; text-align: left; }

        .da-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .da-rule { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, #cbd5e1); }
        .da-head .da-rule:last-child { background: linear-gradient(90deg, #cbd5e1, transparent); }
        .da-title {
          font-size: 10.5px; font-weight: 700; letter-spacing: .12em;
          text-transform: uppercase; color: #94a3b8;
        }

        .da-list { display: flex; flex-direction: column; gap: 8px; }

        .da-card {
          position: relative;
          display: flex; align-items: center; gap: 11px;
          width: 100%;
          padding: 9px 11px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          overflow: hidden;
          opacity: 0;
          animation: da-in .5s cubic-bezier(.22, 1, .36, 1) forwards;
          transition: border-color .18s, background .18s, box-shadow .18s, transform .18s;
        }
        /* light sweep on hover */
        .da-card::after {
          content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 40%;
          background: linear-gradient(100deg, transparent, rgba(99, 102, 241, .12), transparent);
          transform: translateX(-130%) skewX(-18deg);
          pointer-events: none;
        }
        .da-card:hover {
          border-color: #a5b4fc; background: #fff;
          box-shadow: 0 6px 18px rgba(79, 70, 229, .14);
          transform: translateY(-1px);
        }
        .da-card:hover::after { transform: translateX(380%) skewX(-18deg); transition: transform .7s ease; }
        .da-card:active { transform: translateY(0) scale(.99); }
        .da-card:focus-visible { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, .18); }

        .da-active {
          border-color: #4f46e5; background: rgba(79, 70, 229, .06);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, .1);
        }

        .da-ico {
          flex-shrink: 0; width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          color: #fff; border-radius: 10px;
          background: linear-gradient(135deg, #0f172a, #4f46e5);
          box-shadow: 0 4px 10px rgba(79, 70, 229, .3);
        }

        .da-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
        .da-meta b { font-size: 13px; font-weight: 700; color: #0f172a; }
        .da-meta small {
          font-size: 11.5px; color: #64748b;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .da-pill {
          flex-shrink: 0;
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 10px;
          font-size: 11px; font-weight: 700; color: #fff;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 999px;
          box-shadow: 0 3px 10px rgba(79, 70, 229, .3);
          transition: transform .18s, box-shadow .18s;
        }
        .da-card:hover .da-pill { transform: scale(1.05); box-shadow: 0 5px 14px rgba(79, 70, 229, .4); }
        .da-active .da-pill { background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 3px 10px rgba(16, 185, 129, .35); }

        @keyframes da-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .da-card { animation: none; opacity: 1; }
          .da-card:hover::after { transition: none; }
        }
        @media (max-width: 400px) { .da-pill { padding: 5px 8px; } }
      `}</style>
    </div>
  )
}