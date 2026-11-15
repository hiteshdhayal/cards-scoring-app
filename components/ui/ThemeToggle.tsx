'use client';

import { use, useState } from 'react';
import { browser } from 'react-dom';
import { Moon } from '@/components/ui/Icon';

function getEffectiveTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  use(browser('Reads and toggles the saved color theme.'));
  const [theme, setTheme] = useState<'light' | 'dark'>(getEffectiveTheme);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  return (
    <button
      type="button"
      className="topbar-link"
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Moon size={20} />
    </button>
  );
}
