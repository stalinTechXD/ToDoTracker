const LABELS = {
  idle: 'Idle',
  loading: 'Loading…',
  syncing: 'Syncing…',
  synced: 'Synced',
  offline: 'Offline',
  error: 'Error',
  unconfigured: 'Not connected'
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.round(diff / 1000)
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function SyncBadge({ status, error, lastSyncedAt }) {
  const label = LABELS[status] || status
  const title =
    status === 'error' && error
      ? error
      : lastSyncedAt
      ? `Last synced ${timeAgo(lastSyncedAt)}`
      : label

  return (
    <div className={`sync-badge sync-${status}`} title={title}>
      <span className="sync-dot" />
      <span className="sync-label">{label}</span>
      {lastSyncedAt && (status === 'synced' || status === 'idle') && (
        <span className="sync-time">· {timeAgo(lastSyncedAt)}</span>
      )}
    </div>
  )
}
