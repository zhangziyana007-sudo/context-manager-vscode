import React from 'react';

interface Props {
  pendingCount: number;
  doneCount: number;
  lastUpdated: string;
  topPending: string[];
  onViewTodos: () => void;
}

export function ResumeBanner({ pendingCount, doneCount, lastUpdated, topPending, onViewTodos }: Props) {
  if (pendingCount === 0 && doneCount === 0) { return null; }

  return (
    <div className="resume-banner">
      <div className="resume-header">
        <span className="resume-title">上次离开时</span>
        {lastUpdated && <span className="resume-date">{lastUpdated}</span>}
      </div>

      {pendingCount > 0 && (
        <div className="resume-pending">
          <span className="resume-count">{pendingCount}</span>
          <span className="resume-label">个待办未完成</span>
        </div>
      )}

      {topPending.length > 0 && (
        <ul className="resume-list">
          {topPending.map((text, i) => (
            <li key={i}>{text}</li>
          ))}
          {pendingCount > topPending.length && (
            <li className="resume-more">还有 {pendingCount - topPending.length} 项...</li>
          )}
        </ul>
      )}

      {doneCount > 0 && (
        <div className="resume-done">
          ✅ 已完成 {doneCount} 项
        </div>
      )}

      <button className="btn btn-small" onClick={onViewTodos}>
        查看全部待办 →
      </button>
    </div>
  );
}
