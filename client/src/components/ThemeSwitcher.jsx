import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette, Check } from 'lucide-react';

const ThemeSwitcher = ({ compact = false }) => {
  const { theme, setTheme, themes, currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // If compact inline display (for mobile menu)
  if (compact) {
    return (
      <div className="pt-2 pb-1">
        <p className="text-xs font-bold uppercase tracking-wider text-theme-muted mb-2 px-1">
          Select Theme
        </p>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'bg-theme-elevated border-theme-accent shadow-sm'
                    : 'bg-theme-surface border-theme hover:bg-theme-elevated'
                }`}
              >
                {/* Circular 2-tone swatch */}
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 relative overflow-hidden border"
                  style={{
                    borderColor: t.preview.border,
                    backgroundColor: t.preview.bg,
                  }}
                >
                  <div
                    className="absolute inset-y-0 right-0 w-1/2"
                    style={{ background: t.preview.gradient }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate text-theme-primary">{t.name}</p>
                  <p className="text-[10px] text-theme-muted">{t.tag}</p>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-theme-accent flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop popover dropdown
  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-xl bg-theme-surface hover:bg-theme-elevated border border-theme text-theme-primary transition-all duration-200 theme-btn-hover"
        aria-label="Change theme"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={`Current Theme: ${currentTheme.name}`}
      >
        {/* Active swatch preview pill */}
        <div
          className="w-5 h-5 rounded-full relative overflow-hidden border shadow-sm"
          style={{
            borderColor: currentTheme.preview.border,
            backgroundColor: currentTheme.preview.bg,
          }}
        >
          <div
            className="absolute inset-y-0 right-0 w-1/2"
            style={{ background: currentTheme.preview.gradient }}
          />
        </div>
        <Palette className="w-4 h-4 text-theme-accent transition-transform duration-300" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute right-0 mt-2.5 w-64 rounded-2xl bg-theme-surface border border-theme shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-1.5 border-b border-theme flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">
              Appearance
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-theme-accent-light text-theme-accent">
              4 Themes
            </span>
          </div>

          <div className="pt-1 space-y-1">
            {themes.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-theme-elevated text-theme-primary font-bold shadow-sm'
                      : 'text-theme-muted hover:text-theme-primary hover:bg-theme-elevated'
                  }`}
                  role="menuitem"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* Live circular preview swatch */}
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 relative overflow-hidden border-2 shadow-inner"
                      style={{
                        borderColor: t.preview.border,
                        backgroundColor: t.preview.bg,
                      }}
                    >
                      <div
                        className="absolute inset-y-0 right-0 w-1/2"
                        style={{ background: t.preview.gradient }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold text-theme-primary truncate">
                          {t.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wide bg-theme-elevated border border-theme text-theme-muted">
                          {t.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-theme-muted truncate">{t.description}</p>
                    </div>
                  </div>

                  {isActive ? (
                    <div className="w-5 h-5 rounded-full bg-theme-accent-light flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-theme-accent" />
                    </div>
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
