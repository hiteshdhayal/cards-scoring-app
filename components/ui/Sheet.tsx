'use client';

import { useRef } from 'react';
import { XMark } from './Icon';

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (startY.current == null || !sheetRef.current) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) {
      sheetRef.current.style.transition = 'none';
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!sheetRef.current || startY.current == null) return;
    const dy = e.changedTouches[0].clientY - startY.current;
    sheetRef.current.style.transition = '';
    sheetRef.current.style.transform = '';
    startY.current = null;
    if (dy > 80) onClose();
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2 className="headline">{title}</h2>
          <button className="sheet-close" onClick={onClose} aria-label="Close">
            <XMark size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
