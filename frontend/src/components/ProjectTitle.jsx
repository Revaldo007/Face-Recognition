// Reusable animated project title - "face scan" style. Self-contained (no Tailwind / icon library).
//
//   <ProjectTitle />                    -> default
//   <ProjectTitle title="Other text" /> -> override the text on one page
//
// Change PROJECT_TITLE once and every page updates.

export const PROJECT_TITLE =
  'Facial Recognition-Based Automated Students Attendance Monitoring System'

export default function ProjectTitle({ title = PROJECT_TITLE, className = '' }) {
  return (
    <div className={`pt-wrap ${className}`} role="banner">
      <div className="pt-frame">
        {/* scanner-style corner brackets */}
        <i className="pt-c pt-tl" aria-hidden="true" />
        <i className="pt-c pt-tr" aria-hidden="true" />
        <i className="pt-c pt-bl" aria-hidden="true" />
        <i className="pt-c pt-br" aria-hidden="true" />

        <div className="pt-box">
          <h2 className="pt-text">{title}</h2>
          {/* scan beam that reveals the title, then sweeps across it again every few seconds */}
          <span className="pt-beam" aria-hidden="true" />
        </div>
      </div>

      <style>{`
        .pt-wrap {
          display: flex;
          justify-content: center;
          width: 100%;
          max-width: 940px;
          margin: 0 auto;
          user-select: none;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        .pt-frame {
          position: relative;
          max-width: 100%;
          padding: 10px 28px;
          box-sizing: border-box;
        }

        /* ── corner brackets ── */
        .pt-c {
          position: absolute;
          width: 14px;
          height: 14px;
          border: 2px solid #6366f1;
          opacity: 0;
          filter: drop-shadow(0 0 3px rgba(99, 102, 241, .55));
          animation:
            pt-c-in .8s cubic-bezier(.22, 1, .36, 1) .1s forwards,
            pt-c-pulse 3.2s ease-in-out 1.2s infinite;
        }
        .pt-tl { top: 0;    left: 0;  border-right: 0; border-bottom: 0; border-top-left-radius: 6px;     --tx: 14px;  --ty: 10px; }
        .pt-tr { top: 0;    right: 0; border-left: 0;  border-bottom: 0; border-top-right-radius: 6px;    --tx: -14px; --ty: 10px; }
        .pt-bl { bottom: 0; left: 0;  border-right: 0; border-top: 0;    border-bottom-left-radius: 6px;  --tx: 14px;  --ty: -10px; }
        .pt-br { bottom: 0; right: 0; border-left: 0;  border-top: 0;    border-bottom-right-radius: 6px; --tx: -14px; --ty: -10px; }

        /* ── title text ── */
        .pt-box { position: relative; }
        .pt-text {
          margin: 0;
          text-align: center;
          font-size: clamp(15px, 2.3vw, 22px);
          font-weight: 700;
          letter-spacing: -0.01em;
          line-height: 1.35;
          text-wrap: balance;
          background-image: linear-gradient(90deg, #0f172a 0%, #4338ca 25%, #7c3aed 50%, #4338ca 75%, #0f172a 100%);
          background-size: 250% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          clip-path: inset(0 100% 0 0);
          animation:
            pt-reveal 1.5s linear .5s forwards,
            pt-flow 7s linear infinite;
        }

        /* ── scan beam ── */
        .pt-beam {
          position: absolute;
          top: -6px;
          bottom: -6px;
          left: 0;
          width: 2px;
          opacity: 0;
          pointer-events: none;
          background: linear-gradient(180deg, transparent, #7c3aed 20%, #4f46e5 80%, transparent);
          box-shadow: 0 0 12px 3px rgba(124, 58, 237, .5);
          animation: pt-beam 6s linear .2s infinite;
        }
        .pt-beam::before {               /* soft trail behind the beam */
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          right: 100%;
          width: 70px;
          background: linear-gradient(90deg, transparent, rgba(124, 58, 237, .16));
        }

        @keyframes pt-c-in {
          from { opacity: 0; transform: translate(var(--tx), var(--ty)); }
          to   { opacity: 1; transform: translate(0, 0); }
        }
        @keyframes pt-c-pulse {
          0%, 100% { border-color: #6366f1; filter: drop-shadow(0 0 3px rgba(99, 102, 241, .5)); }
          50%      { border-color: #a78bfa; filter: drop-shadow(0 0 8px rgba(167, 139, 250, .9)); }
        }
        @keyframes pt-reveal {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0 0 0); }
        }
        @keyframes pt-flow {
          from { background-position: 0% 50%; }
          to   { background-position: -250% 50%; }
        }
        /* 0.3s-1.8s: beam crosses the title (matches the reveal), then rests until the next loop */
        @keyframes pt-beam {
          0%   { left: 0;    opacity: 0; }
          5%   { left: 0;    opacity: 1; }
          30%  { left: 100%; opacity: 1; }
          33%  { left: 100%; opacity: 0; }
          100% { left: 100%; opacity: 0; }
        }

        @media (max-width: 480px) {
          .pt-frame { padding: 9px 20px; }
          .pt-c { width: 11px; height: 11px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pt-c { animation: none; opacity: 1; }
          .pt-text { animation: none; clip-path: none; }
          .pt-beam { display: none; }
        }
      `}</style>
    </div>
  )
}