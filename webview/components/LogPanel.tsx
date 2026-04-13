import React, { useState, useMemo } from 'react';
import type { ProjectContext, LogEntry } from '../../src/types';

interface Props {
  context: ProjectContext;
  onAddEntry: (entry: LogEntry) => void;
}

export function LogPanel({ context, onAddEntry }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [change, setChange] = useState('');
  const [scope, setScope] = useState('');

  const logSection = context.sections.find(s => s.id === 'log');

  const entries = useMemo(() => {
    if (!logSection) { return []; }
    const result: LogEntry[] = [];
    const lines = logSection.content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|$/);
      if (match) {
        result.push({ date: match[1], change: match[2], scope: match[3] });
      }
    }
    return result;
  }, [logSection]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!change.trim()) { return; }
    onAddEntry({ date, change: change.trim(), scope: scope.trim() || '—' });
    setChange('');
    setScope('');
  }

  if (!logSection) {
    return (
      <div className="panel-empty">
        <p>未找到"维护日志"章节</p>
      </div>
    );
  }

  return (
    <div className="log-panel">
      <form className="log-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            className="log-input date-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <div className="form-row">
          <input
            className="log-input"
            type="text"
            placeholder="修改内容..."
            value={change}
            onChange={e => setChange(e.target.value)}
          />
        </div>
        <div className="form-row">
          <input
            className="log-input"
            type="text"
            placeholder="影响范围..."
            value={scope}
            onChange={e => setScope(e.target.value)}
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={!change.trim()}>
            添加
          </button>
        </div>
      </form>

      <div className="log-table">
        <div className="log-header">
          <span className="log-col date">日期</span>
          <span className="log-col change">修改内容</span>
          <span className="log-col scope">影响范围</span>
        </div>
        {entries.length === 0 && (
          <p className="panel-empty-text">暂无日志记录</p>
        )}
        {entries.map((entry, i) => (
          <div key={i} className="log-row">
            <span className="log-col date">{entry.date}</span>
            <span className="log-col change">{entry.change}</span>
            <span className="log-col scope">{entry.scope}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
