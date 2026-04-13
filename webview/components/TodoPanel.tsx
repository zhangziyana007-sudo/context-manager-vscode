import React, { useState, useMemo } from 'react';
import type { ProjectContext, TodoItem } from '../../src/types';

interface Props {
  context: ProjectContext;
  onToggle: (line: number) => void;
  onAdd: (text: string) => void;
}

export function TodoPanel({ context, onToggle, onAdd }: Props) {
  const [newTodo, setNewTodo] = useState('');

  const statusSection = context.sections.find(s => s.id === 'status');

  const todos = useMemo(() => {
    if (!statusSection) { return []; }
    const items: (TodoItem & { absoluteLine: number })[] = [];
    const lines = context.rawContent.split('\n');
    for (let i = statusSection.lineStart; i <= statusSection.lineEnd; i++) {
      const match = lines[i]?.match(/^- \[([ xX])\]\s+(.*)/);
      if (match) {
        items.push({
          done: match[1] !== ' ',
          text: match[2].trim(),
          line: i,
          absoluteLine: i,
        });
      }
    }
    return items;
  }, [context.rawContent, statusSection]);

  const pending = todos.filter(t => !t.done);
  const completed = todos.filter(t => t.done);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = newTodo.trim();
    if (!text) { return; }
    onAdd(text);
    setNewTodo('');
  }

  if (!statusSection) {
    return (
      <div className="panel-empty">
        <p>未找到"当前状态与待办"章节</p>
      </div>
    );
  }

  return (
    <div className="todo-panel">
      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          className="todo-input"
          type="text"
          placeholder="添加待办事项..."
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={!newTodo.trim()}>
          添加
        </button>
      </form>

      {pending.length > 0 && (
        <div className="todo-group">
          <h4 className="todo-group-title">进行中 ({pending.length})</h4>
          {pending.map(todo => (
            <label key={todo.absoluteLine} className="todo-item">
              <input
                type="checkbox"
                checked={false}
                onChange={() => onToggle(todo.absoluteLine)}
              />
              <span className="todo-text">{todo.text}</span>
            </label>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="todo-group">
          <h4 className="todo-group-title">已完成 ({completed.length})</h4>
          {completed.map(todo => (
            <label key={todo.absoluteLine} className="todo-item done">
              <input
                type="checkbox"
                checked={true}
                onChange={() => onToggle(todo.absoluteLine)}
              />
              <span className="todo-text">{todo.text}</span>
            </label>
          ))}
        </div>
      )}

      {todos.length === 0 && (
        <p className="panel-empty-text">暂无待办事项</p>
      )}
    </div>
  );
}
