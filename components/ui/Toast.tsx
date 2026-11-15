'use client';

import { useEffect } from 'react';
import type { ToastMessage } from '@/lib/useGame';

export function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div className="toast" role="status">
      <span style={{ flex: 1 }}>{toast.text}</span>
      {toast.retry && (
        <button
          type="button"
          className="toast-retry"
          onClick={() => {
            toast.retry?.();
            onDismiss();
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
