import { useRef, useState } from 'react'
import { createGitHubStore } from '../lib/githubStore'

function timeAgo(iso) {
  if (!iso) return 'never'
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleString()
}

export default function SettingsModal({
  config,
  status,
  error,
  lastSyncedAt,
  todos,
  onImport,
  onClose
}) {
  const [testState, setTestState] = useState('idle') // idle | testing | ok | fail
  const [testMsg, setTestMsg] = useState('')
  const fileRef = useRef(null)

  const cfg = config || {}
  const repoUrl =
    cfg.owner && cfg.repo ? `https://github.com/${cfg.owner}/${cfg.repo}` : null

  async function testConnection() {
    setTestState('testing')
    setTestMsg('')
    try {
      const store = createGitHubStore(cfg)
      const info = await store.verify()
      const canWrite = info.permissions?.push ?? true
      if (!canWrite) {
        setTestState('fail')
        setTestMsg(`Connected to ${info.fullName}, but the token lacks write (push) access.`)
        return
      }
      setTestState('ok')
      setTestMsg(`Connected to ${info.fullName} (${info.private ? 'private' : 'public'}).`)
    } catch (err) {
      setTestState('fail')
      setTestMsg(err.message || 'Connection failed.')
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ version: 1, todos }, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orbittasks-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function importJson(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        const incoming = Array.isArray(parsed) ? parsed : parsed.todos
        if (Array.isArray(incoming)) {
          onImport(incoming, 'merge')
          setTestState('ok')
          setTestMsg(`Imported ${incoming.length} tasks.`)
        }
      } catch {
        setTestState('fail')
        setTestMsg('Invalid JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Connection & backup</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <div className="modal-body">
          <section className="settings-section">
            <h3>GitHub data repository</h3>
            <p className="muted">
              These values are read from <code>appsettings.json</code> and the
              <code> VITE_GITHUB_TOKEN</code> environment variable. To change them, edit those files
              and restart the dev server — they are intentionally not editable in the UI.
            </p>

            <dl className="kv">
              <div>
                <dt>Owner</dt>
                <dd>{cfg.owner || <span className="missing">— not set —</span>}</dd>
              </div>
              <div>
                <dt>Repository</dt>
                <dd>
                  {repoUrl ? (
                    <a href={repoUrl} target="_blank" rel="noreferrer">{cfg.repo}</a>
                  ) : (
                    <span className="missing">— not set —</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{cfg.branch || <span className="missing">— not set —</span>}</dd>
              </div>
              <div>
                <dt>File path</dt>
                <dd>{cfg.path || <span className="missing">— not set —</span>}</dd>
              </div>
              <div>
                <dt>Access token</dt>
                <dd>
                  {cfg.hasToken ? (
                    <span className="badge-ok">Loaded from environment</span>
                  ) : (
                    <span className="missing">Missing — set VITE_GITHUB_TOKEN in .env</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className={`status-pill status-${status}`}>{status}</span>
                  <span className="muted"> · last sync {timeAgo(lastSyncedAt)}</span>
                </dd>
              </div>
            </dl>

            {error && status === 'error' && <div className="field-error">{error}</div>}

            <div className="test-row">
              <button
                className="btn btn-ghost"
                onClick={testConnection}
                disabled={testState === 'testing' || !cfg.hasToken || !cfg.owner || !cfg.repo}
              >
                {testState === 'testing' ? 'Testing…' : 'Test connection'}
              </button>
              {testMsg && (
                <span className={`test-msg ${testState === 'ok' ? 'ok' : testState === 'fail' ? 'fail' : ''}`}>
                  {testMsg}
                </span>
              )}
            </div>
          </section>

          <section className="settings-section">
            <h3>Backup</h3>
            <p className="muted">Your tasks already live in the repo; these are local file backups.</p>
            <div className="test-row">
              <button className="btn btn-ghost" onClick={exportJson}>Export JSON</button>
              <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Import JSON</button>
              <input ref={fileRef} type="file" accept="application/json" hidden onChange={importJson} />
            </div>
          </section>

          <section className="settings-section security-note">
            <ShieldGlyph />
            <p className="muted">
              The token is supplied via an environment variable and sent only to
              <code> api.github.com</code> over HTTPS. Note that in a client-side build, any
              <code> VITE_</code> variable is embedded into the bundle and visible in the browser —
              use a fine-grained token scoped to just the data repo, and put a server/proxy in front
              for anything beyond personal use.
            </p>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

function ShieldGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shield"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
  )
}
