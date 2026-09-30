import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createGitHubStore } from '../lib/githubStore'
import { uid } from '../lib/utils'

const DOC_VERSION = 1

export function newTodo(partial = {}) {
  const now = new Date().toISOString()
  return {
    id: uid(),
    title: '',
    notes: '',
    links: [],
    tags: [],
    priority: 'medium',
    due: null,
    completed: false,
    createdAt: now,
    updatedAt: now,
    order: Date.now(),
    ...partial
  }
}

// Sync status: 'idle' | 'loading' | 'syncing' | 'synced' | 'offline' | 'error' | 'unconfigured'
// The GitHub repo is the ONLY persistence layer — nothing is cached in localStorage.
export function useTodoStore(config) {
  const [todos, setTodos] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  const shaRef = useRef(null)
  const saveTimer = useRef(null)
  const pendingRef = useRef(false)
  const savingRef = useRef(false)
  const latestRef = useRef(todos)
  latestRef.current = todos

  const isConfigured = Boolean(
    config && config.token && config.owner && config.repo && config.path
  )

  const store = useMemo(() => {
    if (!isConfigured) return null
    return createGitHubStore(config)
  }, [
    isConfigured,
    config?.token,
    config?.owner,
    config?.repo,
    config?.path,
    config?.branch
  ])

  // Read the current state straight from the GitHub repo.
  const pull = useCallback(async () => {
    if (!store) {
      setStatus('unconfigured')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const { data, sha } = await store.load()
      shaRef.current = sha
      setTodos(data?.todos ?? [])
      setLastSyncedAt(new Date().toISOString())
      setStatus('synced')
    } catch (err) {
      setError(err.message)
      setStatus(err.status === 0 ? 'offline' : 'error')
    }
  }, [store])

  useEffect(() => {
    if (store) pull()
    else setStatus('unconfigured')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store])

  // Write current state to the GitHub repo, serializing concurrent writes.
  const flush = useCallback(
    async (nextTodos) => {
      if (!store) return
      if (savingRef.current) {
        pendingRef.current = true
        return
      }
      savingRef.current = true
      setStatus('syncing')
      setError(null)
      try {
        const doc = {
          version: DOC_VERSION,
          updatedAt: new Date().toISOString(),
          todos: nextTodos
        }
        const { sha } = await store.save(doc, shaRef.current)
        shaRef.current = sha
        setLastSyncedAt(new Date().toISOString())
        setStatus('synced')
      } catch (err) {
        setError(err.message)
        setStatus(err.status === 0 ? 'offline' : 'error')
      } finally {
        savingRef.current = false
        if (pendingRef.current) {
          pendingRef.current = false
          flush(latestRef.current)
        }
      }
    },
    [store]
  )

  // Any mutation updates local React state then pushes to GitHub (debounced).
  const commit = useCallback(
    (updater) => {
      setTodos((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        latestRef.current = next
        if (store) {
          if (saveTimer.current) clearTimeout(saveTimer.current)
          saveTimer.current = setTimeout(() => flush(next), 900)
        }
        return next
      })
    },
    [flush, store]
  )

  const syncNow = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    flush(latestRef.current)
  }, [flush])

  // --- Mutations -----------------------------------------------------------
  const addTodo = useCallback(
    (data) => {
      const item = newTodo(data)
      commit((prev) => [item, ...prev])
      return item
    },
    [commit]
  )

  const updateTodo = useCallback(
    (id, patch) => {
      commit((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
        )
      )
    },
    [commit]
  )

  const toggleTodo = useCallback(
    (id) => {
      commit((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() }
            : t
        )
      )
    },
    [commit]
  )

  const removeTodo = useCallback(
    (id) => {
      commit((prev) => prev.filter((t) => t.id !== id))
    },
    [commit]
  )

  const clearCompleted = useCallback(() => {
    commit((prev) => prev.filter((t) => !t.completed))
  }, [commit])

  const reorder = useCallback(
    (fromId, toId) => {
      commit((prev) => {
        const list = [...prev]
        const from = list.findIndex((t) => t.id === fromId)
        const to = list.findIndex((t) => t.id === toId)
        if (from === -1 || to === -1) return prev
        const [moved] = list.splice(from, 1)
        list.splice(to, 0, moved)
        return list.map((t, i) => ({ ...t, order: i }))
      })
    },
    [commit]
  )

  const importTodos = useCallback(
    (incoming, mode = 'merge') => {
      commit((prev) => {
        if (mode === 'replace') return incoming
        const byId = new Map(prev.map((t) => [t.id, t]))
        for (const t of incoming) byId.set(t.id, t)
        return Array.from(byId.values())
      })
    },
    [commit]
  )

  return {
    todos,
    status,
    error,
    lastSyncedAt,
    isConfigured,
    pull,
    syncNow,
    addTodo,
    updateTodo,
    toggleTodo,
    removeTodo,
    clearCompleted,
    reorder,
    importTodos
  }
}
