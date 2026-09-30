import { useEffect, useMemo, useState } from 'react'
import { loadAppConfig } from './lib/appConfig'
import { useTodoStore } from './hooks/useTodoStore'
import Header from './components/Header'
import TodoComposer from './components/TodoComposer'
import Toolbar from './components/Toolbar'
import TodoList from './components/TodoList'
import SettingsModal from './components/SettingsModal'
import EmptyState from './components/EmptyState'
import Stats from './components/Stats'

const DEFAULT_FILTERS = {
  query: '',
  status: 'all', // all | active | completed
  priority: 'all',
  tag: 'all',
  sort: 'manual' // manual | due | priority | created | alpha
}

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 }

export default function App() {
  const [config, setConfig] = useState(null)
  const [configError, setConfigError] = useState(null)
  const [theme, setTheme] = useState('dark')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  // Load immutable config (repo coordinates + env token) once at startup.
  useEffect(() => {
    loadAppConfig()
      .then((c) => {
        setConfig(c)
        setTheme(c.theme || 'dark')
      })
      .catch((e) => setConfigError(e.message))
  }, [])

  const store = useTodoStore(config)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const allTags = useMemo(() => {
    const set = new Set()
    store.todos.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)))
    return Array.from(set).sort()
  }, [store.todos])

  const visibleTodos = useMemo(() => {
    let list = [...store.todos]
    const q = filters.query.trim().toLowerCase()

    if (q) {
      list = list.filter((t) => {
        const haystack = [
          t.title,
          t.notes,
          ...(t.tags || []),
          ...(t.links || []).map((l) => `${l.label} ${l.url}`)
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    }
    if (filters.status === 'active') list = list.filter((t) => !t.completed)
    if (filters.status === 'completed') list = list.filter((t) => t.completed)
    if (filters.priority !== 'all')
      list = list.filter((t) => t.priority === filters.priority)
    if (filters.tag !== 'all')
      list = list.filter((t) => (t.tags || []).includes(filters.tag))

    switch (filters.sort) {
      case 'due':
        list.sort((a, b) => {
          if (!a.due) return 1
          if (!b.due) return -1
          return new Date(a.due) - new Date(b.due)
        })
        break
      case 'priority':
        list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
        break
      case 'created':
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        break
      case 'alpha':
        list.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }
    return list
  }, [store.todos, filters])

  const canReorder = filters.sort === 'manual' && filters.status === 'all'

  return (
    <div className="app-shell">
      <div className="aurora" aria-hidden="true" />
      <Header
        config={config}
        theme={theme}
        status={store.status}
        error={store.error}
        lastSyncedAt={store.lastSyncedAt}
        onOpenSettings={() => setSettingsOpen(true)}
        onSyncNow={store.syncNow}
        onPull={store.pull}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />

      <main className="container">
        {configError && (
          <div className="config-banner">
            Could not load <code>appsettings.json</code>: {configError}
          </div>
        )}

        <TodoComposer onAdd={store.addTodo} disabled={!store.isConfigured} />

        <Stats todos={store.todos} />

        <Toolbar
          filters={filters}
          setFilters={setFilters}
          tags={allTags}
          onClearCompleted={store.clearCompleted}
        />

        {store.todos.length === 0 ? (
          <EmptyState
            configured={store.isConfigured}
            hasToken={config?.hasToken}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        ) : (
          <TodoList
            todos={visibleTodos}
            canReorder={canReorder}
            onToggle={store.toggleTodo}
            onUpdate={store.updateTodo}
            onRemove={store.removeTodo}
            onReorder={store.reorder}
          />
        )}
      </main>

      {settingsOpen && (
        <SettingsModal
          config={config}
          status={store.status}
          error={store.error}
          lastSyncedAt={store.lastSyncedAt}
          todos={store.todos}
          onImport={store.importTodos}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
