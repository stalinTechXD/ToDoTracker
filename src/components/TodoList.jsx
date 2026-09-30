import { useState } from 'react'
import TodoItem from './TodoItem'

export default function TodoList({
  todos,
  canReorder,
  onToggle,
  onUpdate,
  onRemove,
  onReorder
}) {
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)

  function handleDrop(targetId) {
    if (dragId && targetId && dragId !== targetId) {
      onReorder(dragId, targetId)
    }
    setDragId(null)
    setOverId(null)
  }

  if (todos.length === 0) {
    return <div className="no-results">No tasks match your filters.</div>
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          canReorder={canReorder}
          isDragging={dragId === todo.id}
          isOver={overId === todo.id && dragId !== todo.id}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onDragStart={() => setDragId(todo.id)}
          onDragOver={() => setOverId(todo.id)}
          onDrop={() => handleDrop(todo.id)}
          onDragEnd={() => {
            setDragId(null)
            setOverId(null)
          }}
        />
      ))}
    </ul>
  )
}
