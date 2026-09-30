export default function Toolbar({ filters, setFilters, tags, onClearCompleted }) {
  function update(patch) {
    setFilters((prev) => ({ ...prev, ...patch }))
  }

  return (
    <div className="toolbar">
      <div className="search">
        <SearchGlyph />
        <input
          placeholder="Search tasks, tags, links…"
          value={filters.query}
          onChange={(e) => update({ query: e.target.value })}
        />
        {filters.query && (
          <button className="clear-search" onClick={() => update({ query: '' })}>×</button>
        )}
      </div>

      <div className="segmented">
        {['all', 'active', 'completed'].map((s) => (
          <button
            key={s}
            className={filters.status === s ? 'active' : ''}
            onClick={() => update({ status: s })}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <select
        className="toolbar-select"
        value={filters.priority}
        onChange={(e) => update({ priority: e.target.value })}
        title="Filter by priority"
      >
        <option value="all">All priorities</option>
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <select
        className="toolbar-select"
        value={filters.tag}
        onChange={(e) => update({ tag: e.target.value })}
        title="Filter by tag"
      >
        <option value="all">All tags</option>
        {tags.map((t) => (
          <option key={t} value={t}>#{t}</option>
        ))}
      </select>

      <select
        className="toolbar-select"
        value={filters.sort}
        onChange={(e) => update({ sort: e.target.value })}
        title="Sort"
      >
        <option value="manual">Manual order</option>
        <option value="due">By due date</option>
        <option value="priority">By priority</option>
        <option value="created">Newest first</option>
        <option value="alpha">A → Z</option>
      </select>

      <button className="btn btn-ghost danger-ghost" onClick={onClearCompleted} title="Remove completed tasks">
        Clear done
      </button>
    </div>
  )
}

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
  )
}
