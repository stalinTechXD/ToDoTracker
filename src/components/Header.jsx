import SyncBadge from './SyncBadge'

export default function Header({
  config,
  theme,
  status,
  error,
  lastSyncedAt,
  onOpenSettings,
  onSyncNow,
  onPull,
  onToggleTheme
}) {
  const owner = config?.owner
  const repo = config?.repo
  const repoLabel = owner && repo ? `${owner}/${repo}` : 'not connected'

  return (
    <header className="app-header">
      <div className="container header-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 64 64" width="34" height="34">
              <defs>
                <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#6ee7ff" />
                  <stop offset="1" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="18" fill="none" stroke="url(#hg)" strokeWidth="3" opacity="0.5" />
              <circle cx="32" cy="14" r="5" fill="url(#hg)" />
              <path d="M22 34l7 7 14-15" fill="none" stroke="url(#hg)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="brand-text">
            <h1>OrbitTasks</h1>
            <a
              className="repo-pill"
              href={
                owner && repo ? `https://github.com/${owner}/${repo}` : undefined
              }
              target="_blank"
              rel="noreferrer"
              title="Data repository"
            >
              <GitHubGlyph /> {repoLabel}
            </a>
          </div>
        </div>

        <div className="header-actions">
          <SyncBadge status={status} error={error} lastSyncedAt={lastSyncedAt} />
          <button className="icon-btn" title="Pull from GitHub" onClick={onPull}>
            <DownloadGlyph />
          </button>
          <button className="icon-btn" title="Sync now" onClick={onSyncNow}>
            <UploadGlyph />
          </button>
          <button className="icon-btn" title="Toggle theme" onClick={onToggleTheme}>
            {theme === 'dark' ? <SunGlyph /> : <MoonGlyph />}
          </button>
          <button className="btn btn-ghost" onClick={onOpenSettings}>
            <GearGlyph /> Settings
          </button>
        </div>
      </div>
    </header>
  )
}

function GitHubGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}
function DownloadGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M5 21h14" /></svg>
  )
}
function UploadGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21V9" /><path d="M7 14l5-5 5 5" /><path d="M5 3h14" /></svg>
  )
}
function SunGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  )
}
function MoonGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>
  )
}
function GearGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.1A1.6 1.6 0 006 19.4a1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H.2a2 2 0 110-4h.1A1.6 1.6 0 001.9 6a1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H6a1.6 1.6 0 001-1.5V.2a2 2 0 114 0v.1a1.6 1.6 0 002.7 1.1 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V6a1.6 1.6 0 001.5 1h.1a2 2 0 110 4h-.1a1.6 1.6 0 00-1.4 1z" transform="translate(1.8 1.8) scale(0.85)" /></svg>
  )
}
