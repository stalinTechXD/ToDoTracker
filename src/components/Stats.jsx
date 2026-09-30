import { useMemo } from 'react'

export default function Stats({ todos }) {
  const stats = useMemo(() => {
    const total = todos.length
    const done = todos.filter((t) => t.completed).length
    const active = total - done
    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const overdue = todos.filter(
      (t) => !t.completed && t.due && t.due < today
    ).length
    const dueToday = todos.filter(
      (t) => !t.completed && t.due === today
    ).length
    const pct = total ? Math.round((done / total) * 100) : 0
    return { total, done, active, overdue, dueToday, pct }
  }, [todos])

  if (stats.total === 0) return null

  return (
    <div className="stats">
      <div className="stat">
        <span className="stat-value">{stats.active}</span>
        <span className="stat-label">Active</span>
      </div>
      <div className="stat">
        <span className="stat-value">{stats.done}</span>
        <span className="stat-label">Done</span>
      </div>
      <div className={`stat ${stats.overdue ? 'stat-alert' : ''}`}>
        <span className="stat-value">{stats.overdue}</span>
        <span className="stat-label">Overdue</span>
      </div>
      <div className={`stat ${stats.dueToday ? 'stat-warn' : ''}`}>
        <span className="stat-value">{stats.dueToday}</span>
        <span className="stat-label">Due today</span>
      </div>
      <div className="stat-progress">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${stats.pct}%` }} />
        </div>
        <span className="progress-label">{stats.pct}% complete</span>
      </div>
    </div>
  )
}
