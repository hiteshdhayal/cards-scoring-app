'use client';

export type ActionSheetAction = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
};

export function ActionSheet({
  title,
  actions,
  onCancel,
}: {
  title?: string;
  actions: ActionSheetAction[];
  onCancel: () => void;
}) {
  return (
    <div className="action-sheet-backdrop" onClick={onCancel}>
      <div className="action-sheet-group" onClick={(e) => e.stopPropagation()}>
        <div className="action-sheet-list">
          {title && (
            <div className="footnote" style={{ padding: '14px 16px 2px' }}>
              {title}
            </div>
          )}
          {actions.map((a, i) => (
            <button
              key={i}
              type="button"
              className={`action-sheet-btn ${a.destructive ? 'destructive' : ''}`}
              onClick={a.onSelect}
            >
              {a.label}
            </button>
          ))}
        </div>
        <button type="button" className="action-sheet-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
