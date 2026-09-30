import { useEffect, useRef, useState } from 'react'
import { isValidUrl, normalizeUrl, hostOf, uid } from '../lib/utils'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']

function dueMeta(due, completed) {
  if (!due) return null
  const today = new Date().toISOString().slice(0, 10)
  let state = 'future'
  if (!completed) {
    if (due < today) state = 'overdue'
    else if (due === today) state = 'today'
  }
  const d = new Date(due + 'T00:00:00')
  const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return { state, label }
}

export default function TodoItem({
  todo,
  canReorder,
  isDragging,
  isOver,
  onToggle,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const editRef = useRef(null)

  useEffect(() => {
    if (editing) {
      setDraft(todo)
      setTimeout(() => editRef.current?.focus(), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  function save() {
    onUpdate(todo.id, {
      title: draft.title.trim() || todo.title,
      notes: draft.notes,
      priority: draft.priority,
      due: draft.due || null,
      tags: draft.tags,
      links: draft.links
    })
    setEditing(false)
  }

  function addLink() {
    const url = normalizeUrl(linkUrl)
    if (!isValidUrl(url)) return
    setDraft((d) => ({
      ...d,
      links: [...(d.links || []), { id: uid(), url, label: linkLabel.trim() || hostOf(url) }]
    }))
    setLinkUrl('')
    setLinkLabel('')
  }

  function addTag() {
    const value = tagInput.trim().replace(/^#/, '')
    if (!value) return
    if (!(draft.tags || []).includes(value)) {
      setDraft((d) => ({ ...d, tags: [...(d.tags || []), value] }))
    }
    setTagInput('')
  }

  const due = dueMeta(todo.due, todo.completed)

  return (
    <li
      className={[
        'todo-item',
        `prio-border-${todo.priority}`,
        todo.completed ? 'completed' : '',
        isDragging ? 'dragging' : '',
        isOver ? 'drag-over' : '',
        editing ? 'editing' : ''
      ].join(' ')}
      draggable={canReorder && !editing}
      onDragStart={onDragStart}
      onDragOver={(e) => {
        if (!canReorder) return
        e.preventDefault()
        onDragOver()
      }}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {!editing ? (
        <>
          {canReorder && (
            <span className="drag-handle" title="Drag to reorder" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" /><circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" /><circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" /></svg>
            </span>
          )}

          <button
            className={`checkbox ${todo.completed ? 'checked' : ''}`}
            onClick={() => onToggle(todo.id)}
            aria-label={todo.completed ? 'Mark as active' : 'Mark as complete'}
          >
            {todo.completed && (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4 10-11" /></svg>
            )}
          </button>

          <div className="todo-body" onDoubleClick={() => setEditing(true)}>
            <div className="todo-title-row">
              <span className="todo-title">{todo.title}</span>
              <span className={`prio-tag prio-${todo.priority}`}>{todo.priority}</span>
            </div>

            {todo.notes && <p className="todo-notes">{linkify(todo.notes)}</p>}

            {(todo.links?.length > 0 || todo.tags?.length > 0 || due) && (
              <div className="todo-meta">
                {due && (
                  <span className={`meta-chip due-${due.state}`}>
                    <CalendarGlyph /> {due.label}
                    {due.state === 'overdue' && ' · overdue'}
                    {due.state === 'today' && ' · today'}
                  </span>
                )}
                {todo.tags?.map((t) => (
                  <span key={t} className="meta-chip tag-chip">#{t}</span>
                ))}
                {todo.links?.map((l) => (
                  <a key={l.id} className="meta-chip link-chip" href={l.url} target="_blank" rel="noreferrer" title={l.url}>
                    <LinkGlyph /> {l.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="todo-actions">
            <button className="icon-btn" title="Edit" onClick={() => setEditing(true)}>
              <EditGlyph />
            </button>
            {confirmDelete ? (
              <span className="confirm-delete">
                <button className="icon-btn danger" title="Confirm delete" onClick={() => onRemove(todo.id)}>
                  <CheckGlyph />
                </button>
                <button className="icon-btn" title="Cancel" onClick={() => setConfirmDelete(false)}>
                  <CloseGlyph />
                </button>
              </span>
            ) : (
              <button className="icon-btn" title="Delete" onClick={() => setConfirmDelete(true)}>
                <TrashGlyph />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="todo-edit">
          <input
            ref={editRef}
            className="edit-title"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
          <textarea
            className="edit-notes"
            rows={2}
            placeholder="Notes"
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />

          <div className="edit-row">
            <label className="field">
              <span className="field-label">Priority</span>
              <select
                value={draft.priority}
                onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Due</span>
              <input
                type="date"
                value={draft.due || ''}
                onChange={(e) => setDraft((d) => ({ ...d, due: e.target.value }))}
              />
            </label>
          </div>

          <div className="chip-input">
            {(draft.tags || []).map((t) => (
              <span key={t} className="chip tag-chip">
                #{t}
                <button type="button" onClick={() => setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== t) }))}>×</button>
              </span>
            ))}
            <input
              placeholder="Add tag + Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTag()
                }
              }}
            />
          </div>

          <div className="link-list">
            {(draft.links || []).map((l) => (
              <span key={l.id} className="chip link-chip">
                <LinkGlyph />
                <a href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
                <button type="button" onClick={() => setDraft((d) => ({ ...d, links: d.links.filter((x) => x.id !== l.id) }))}>×</button>
              </span>
            ))}
          </div>
          <div className="link-inputs">
            <input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addLink()
                }
              }}
            />
            <input
              placeholder="Label (optional)"
              value={linkLabel}
              onChange={(e) => setLinkLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addLink()
                }
              }}
            />
            <button type="button" className="btn btn-ghost" onClick={addLink}>Attach</button>
          </div>

          <div className="edit-actions">
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </div>
      )}
    </li>
  )
}

// Render plain-text notes while turning raw URLs into clickable links.
function linkify(text) {
  const parts = text.split(/(\bhttps?:\/\/[^\s<>"')]+)/gi)
  return parts.map((part, i) =>
    /^https?:\/\//i.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer">{hostOf(part)}</a>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function CalendarGlyph() {
  return <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
}
function LinkGlyph() {
  return <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.5-1.5" /></svg>
}
function EditGlyph() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
}
function TrashGlyph() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>
}
function CheckGlyph() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4 10-11" /></svg>
}
function CloseGlyph() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
}
