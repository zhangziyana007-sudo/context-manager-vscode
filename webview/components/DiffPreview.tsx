import React, { useMemo } from 'react';
import { diffLines, Change } from 'diff';

interface Props {
  data: { oldContent: string; newContent: string } | null;
}

export function DiffPreview({ data }: Props) {
  const changes = useMemo(() => {
    if (!data) { return []; }
    return diffLines(data.oldContent, data.newContent);
  }, [data]);

  if (!data) {
    return (
      <div className="panel-empty">
        <p>暂无对比数据</p>
        <p className="hint">保存修改后再次查看即可对比变更</p>
      </div>
    );
  }

  const stats = useMemo(() => {
    let added = 0, removed = 0;
    for (const c of changes) {
      if (c.added) { added += c.count || 0; }
      if (c.removed) { removed += c.count || 0; }
    }
    return { added, removed };
  }, [changes]);

  return (
    <div className="diff-panel">
      <div className="diff-stats">
        <span className="diff-stat added">+{stats.added} 行</span>
        <span className="diff-stat removed">-{stats.removed} 行</span>
      </div>
      <div className="diff-content">
        {changes.map((change: Change, i: number) => {
          const className = change.added
            ? 'diff-line added'
            : change.removed
              ? 'diff-line removed'
              : 'diff-line unchanged';

          const lines = change.value.split('\n').filter((l, idx, arr) =>
            idx < arr.length - 1 || l !== ''
          );

          return lines.map((line, j) => (
            <div key={`${i}-${j}`} className={className}>
              <span className="diff-marker">
                {change.added ? '+' : change.removed ? '-' : ' '}
              </span>
              <span className="diff-text">{line || ' '}</span>
            </div>
          ));
        })}
      </div>
    </div>
  );
}
