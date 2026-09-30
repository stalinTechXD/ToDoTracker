import { useRef, useState } from 'react'
import { isValidUrl, normalizeUrl, hostOf, uid } from '../lib/utils'

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

export default function TodoComposer({ onAdd, disabled }) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState('medium')
  const [due, setDue] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [links, setLinks] = useState([])
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [linkError, setLinkError] = useState('')
  const titleRef = useRef(null)

  function reset() {
    setTitle('')
    setNotes('')
    setPriority('medium')
    setDue('')
    setTags([])
    setTagInput('')
    setLinks([])
    setLinkUrl('')
    setLinkLabel('')
    setLinkError('')
  }

  function addLink() {
    const url = normalizeUrl(linkUrl)
    if (!isValidUrl(url)) {
      setLinkError('Enter a valid http(s) link')
      return
    }
    setLinks((prev) => [
      ...prev,
      { id: uid(), url, label: linkLabel.trim() || hostOf(url) }
    ])
    setLinkUrl('')
    setLinkLabel('')
    setLinkError('')
  }

  function addTagFromInput() {
    const value = tagInput.trim().replace(/^#/, '')
    if (!value) return
    if (!tags.includes(value)) setTags((prev) => [...prev, value])
    setTagInput('')
  }

  function submit(e) {
    e.preventDefault()
    if (!title.trim() || disabled) return
    onAdd({
      title: title.trim(),
      notes: notes.trim(),
      priority,
      due: due || null,
      tags,
      links
    })
    reset()
    setExpanded(false)
    titleRef.current?.focus()
  }

  return (
    <form className={`composer ${expanded ? 'expanded' : ''}`} onSubmit={submit}>
      <div className="composer-main">
        <div className={`prio-dot prio-${priority}`} title={`Priority: ${priority}`} />
        <input
          ref={titleRef}
          className="composer-title"
          placeholder={disabled ? 'Connect a GitHub repo in Settings to begin…' : 'Add a task and press Enter…'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          disabled={disabled}
        />
        <button
          type="button"
          className="icon-btn"
          title={expanded ? 'Collapse' : 'More options'}
          onClick={() => setExpanded((v) => !v)}
          disabled={disabled}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <button type="submit" className="btn btn-primary" disabled={disabled || !title.trim()}>
          Add
        </button>
      </div>

      {expanded && (
        <div className="composer-details">
          <textarea
            className="composer-notes"
            placeholder="Notes (optional) — paste links here too"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <div className="composer-row">
            <label className="field">
              <span className="field-label">Priority</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Due date</span>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
          </div>

          <div className="field">
            <span className="field-label">Tags</span>
            <div className="chip-input">
              {tags.map((t) => (
                <span key={t} className="chip tag-chip">
                  #{t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>×</button>
                </span>
              ))}
              <input
                placeholder="Add tag + Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTagFromInput()
                  }
                }}
              />
            </div>
          </div>

          <div className="field">
            <span className="field-label">Hyperlinks</span>
            <div className="link-list">
              {links.map((l) => (
                <span key={l.id} className="chip link-chip">
                  <LinkGlyph />
                  <a href={l.url} target="_blank" rel="noreferrer">{l.label}</a>
                  <button type="button" onClick={() => setLinks(links.filter((x) => x.id !== l.id))}>×</button>
                </span>
              ))}
            </div>
            <div className="link-inputs">
              <input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value)
                  setLinkError('')
                }}
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
              <button type="button" className="btn btn-ghost" onClick={addLink}>
                Attach
              </button>
            </div>
            {linkError && <div className="field-error">{linkError}</div>}
          </div>
        </div>
      )}
    </form>
  )
}

function LinkGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.5-1.5" /></svg>
  )
}
