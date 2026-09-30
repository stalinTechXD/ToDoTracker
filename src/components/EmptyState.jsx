export default function EmptyState({ configured, hasToken, onOpenSettings }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <svg viewBox="0 0 120 120" width="120" height="120">
          <defs>
            <linearGradient id="eg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#6ee7ff" />
              <stop offset="1" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="44" fill="none" stroke="url(#eg)" strokeWidth="3" opacity="0.35" />
          <circle cx="60" cy="16" r="8" fill="url(#eg)" />
          <path d="M40 64l13 13 28-30" fill="none" stroke="url(#eg)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {configured ? (
        <>
          <h2>Your orbit is clear</h2>
          <p>Add your first task above. Every change is committed straight to your GitHub repo.</p>
        </>
      ) : (
        <>
          <h2>Connect your data repo</h2>
          <p>
            OrbitTasks reads and writes everything directly to a GitHub repo you control — no
            database, no localStorage. Set the repo in <code>appsettings.json</code>
            {hasToken
              ? '.'
              : ' and your PAT in the VITE_GITHUB_TOKEN environment variable, then restart.'}
          </p>
          <button className="btn btn-ghost" onClick={onOpenSettings}>
            View connection
          </button>
        </>
      )}
    </div>
  )
}
