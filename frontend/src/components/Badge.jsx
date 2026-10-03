import { Code2, UserCheck, GraduationCap } from 'lucide-react'

/**
 * Credits badge - fixed to the bottom-right corner of the screen.
 * Usage: <Badge />  (or override any prop, e.g. <Badge guide="Mrs. Real Name" />)
 * Place at: src/components/Badge.jsx
 *
 * Animation theme: "face scan" - matches the scanner frame on the login cover.
 *   1. scanner brackets lock on around the card
 *   2. the text snaps into focus line by line
 *   3. a cyan scan line sweeps down the card every few seconds
 */
export default function Badge({
  developer = 'Benina',
  guide = 'XYZ',
  college = 'Muslim Arts College',
  place = 'Thiruvithancode',
}) {
  return (
    <aside className="dev-badge" tabIndex={0} aria-label="Project credits">
      {/* small screens: collapses to just this icon, expands on hover / focus */}
      <div className="dev-badge-icon"><GraduationCap size={17} /></div>

      <div className="dev-badge-body">
        <div className="dev-badge-row">
          <Code2 size={13} />
          <span>Developed by</span>
          <b>{developer}</b>
        </div>
        <div className="dev-badge-row dev-badge-row-stack">
          <UserCheck size={13} />
          <div className="dev-badge-stack">
            <span>Guided by</span>
            <b>{guide}</b>
          </div>
        </div>
        <div className="dev-badge-college">
          <b>{college}</b>
          <span>{place}</span>
        </div>
      </div>

      <style>{`
        .dev-badge {
          position: fixed;
          right: 16px;
          bottom: 14px;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px 9px 9px;
          background: rgba(255, 255, 255, .82);
          -webkit-backdrop-filter: blur(8px);
                  backdrop-filter: blur(8px);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 6px 20px rgba(15, 23, 42, .08);
          outline: none;
          overflow: hidden;
          transition: box-shadow .25s ease, border-color .25s ease;
          animation: dev-badge-in .7s cubic-bezier(.2, .8, .2, 1) .4s backwards;
        }
        .dev-badge:focus-visible { box-shadow: 0 0 0 2px #4f46e5; }
        .dev-badge:hover { border-color: #67e8f9; box-shadow: 0 10px 26px rgba(6, 182, 212, .18); }
        @keyframes dev-badge-in {
          from { opacity: 0; transform: translateY(12px) scale(.94); }
          to   { opacity: 1; transform: none; }
        }

        /* 1. scanner brackets: lock on, then breathe */
        .dev-badge::before {
          content: '';
          position: absolute;
          inset: 4px;
          pointer-events: none;
          background:
            linear-gradient(#06b6d4, #06b6d4) top left / 9px 1.5px no-repeat,
            linear-gradient(#06b6d4, #06b6d4) top left / 1.5px 9px no-repeat,
            linear-gradient(#06b6d4, #06b6d4) top right / 9px 1.5px no-repeat,
            linear-gradient(#06b6d4, #06b6d4) top right / 1.5px 9px no-repeat,
            linear-gradient(#06b6d4, #06b6d4) bottom left / 9px 1.5px no-repeat,
            linear-gradient(#06b6d4, #06b6d4) bottom left / 1.5px 9px no-repeat,
            linear-gradient(#06b6d4, #06b6d4) bottom right / 9px 1.5px no-repeat,
            linear-gradient(#06b6d4, #06b6d4) bottom right / 1.5px 9px no-repeat;
          animation:
            dev-badge-lock .8s cubic-bezier(.2, .8, .2, 1) .9s backwards,
            dev-badge-breathe 3s ease-in-out 1.8s infinite;
        }
        @keyframes dev-badge-lock {
          from { opacity: 0; transform: scale(1.22); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes dev-badge-breathe { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }

        /* 2. text snaps into focus, line by line */
        .dev-badge-body > * { animation: dev-badge-focus .6s ease backwards; }
        .dev-badge-body > :nth-child(1) { animation-delay: 1s; }
        .dev-badge-body > :nth-child(2) { animation-delay: 1.15s; }
        .dev-badge-body > :nth-child(3) { animation-delay: 1.3s; }
        @keyframes dev-badge-focus {
          from { opacity: 0; filter: blur(5px); transform: translateX(-6px); }
          to   { opacity: 1; filter: blur(0); transform: none; }
        }

        /* 3. scan line sweeps down the card, then rests */
        .dev-badge::after {
          content: '';
          position: absolute;
          left: 0; right: 0;
          top: -26px;
          height: 24px;
          pointer-events: none;
          opacity: 0;
          background:
            linear-gradient(90deg, transparent, #06b6d4 20%, #06b6d4 80%, transparent) bottom / 100% 2px no-repeat,
            linear-gradient(180deg, rgba(6, 182, 212, 0), rgba(6, 182, 212, .2));
          box-shadow: 0 2px 10px rgba(6, 182, 212, .45);
          animation: dev-badge-scan 5s ease-in-out 2s infinite;
        }
        @keyframes dev-badge-scan {
          0%        { top: -26px; opacity: 0; }
          5%        { opacity: 1; }
          42%       { top: 100%; opacity: 1; }
          46%, 100% { top: 100%; opacity: 0; }
        }

        .dev-badge-icon {
          position: relative;
          flex: none;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px; height: 32px;
          border-radius: 9px;
          color: #fff;
          background: linear-gradient(135deg, #1e1b4b, #4f46e5);
        }
        .dev-badge-icon::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          border: 1.5px solid rgba(6, 182, 212, .7);
          pointer-events: none;
          animation: dev-badge-ring 2.4s ease-out 1.5s infinite;
        }
        @keyframes dev-badge-ring { 0% { transform: scale(1); opacity: .8; } 100% { transform: scale(1.5); opacity: 0; } }

        .dev-badge-body { display: flex; flex-direction: column; gap: 3px; line-height: 1.25; text-align: left; white-space: nowrap; }
        .dev-badge-row { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: #64748b; }
        .dev-badge-row svg { color: #4f46e5; flex: none; }
        .dev-badge-row b { color: #0f172a; font-weight: 600; }
        .dev-badge-row-stack { align-items: flex-start; }
        .dev-badge-row-stack svg { margin-top: 2px; }
        .dev-badge-stack { display: flex; flex-direction: column; line-height: 1.25; }
        .dev-badge-college {
          display: flex;
          flex-direction: column;
          margin-top: 3px;
          padding-top: 4px;
          border-top: 1px dashed #cbd5e1;
          font-size: 11px;
          color: #64748b;
        }
        .dev-badge-college b { color: #0f172a; font-weight: 600; font-size: 11.5px; }

        /* medium screens (laptops): compact version, tucked into the corner, clear of the login card */
        @media screen and (max-width: 1399px) {
          .dev-badge { right: 10px; bottom: 10px; gap: 0; padding: 7px 10px; border-radius: 10px; }
          .dev-badge-icon { display: none; }
          .dev-badge-row, .dev-badge-college { font-size: 10.5px; }
          .dev-badge-college b { font-size: 10.5px; }
        }
        /* narrow screens: icon only, details on hover / focus */
        @media screen and (max-width: 1239px) {
          .dev-badge { padding: 5px; }
          .dev-badge-icon { display: flex; width: 30px; height: 30px; }
          .dev-badge-body {
            max-width: 0;
            opacity: 0;
            overflow: hidden;
            transition: max-width .35s ease, opacity .25s ease, margin .35s ease;
          }
          .dev-badge:hover .dev-badge-body,
          .dev-badge:focus .dev-badge-body { max-width: 230px; opacity: 1; margin: 0 6px 0 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .dev-badge, .dev-badge::before, .dev-badge::after,
          .dev-badge-body > *, .dev-badge-icon::after { animation: none; }
          .dev-badge::after { display: none; }
          .dev-badge-body { transition: none; }
        }
      `}</style>
    </aside>
  )
}