import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { MapPin, Loader2, Check, X } from 'lucide-react';

const AddressAutocomplete = ({
  value,
  onChange,
  onSelect,
  selectedCoords,
  placeholder = 'Start typing address or landmark...',
  label,
  required = false,
  id = 'address-autocomplete',
  helperText,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSelectedRef = useRef(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (isSelectedRef.current) {
      isSelectedRef.current = false;
      return;
    }

    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/geocode/suggest?q=${encodeURIComponent(value.trim())}`);
        setSuggestions(res.data || []);
        setShowDropdown((res.data || []).length > 0);
      } catch (err) {
        console.warn('[AddressAutocomplete] Suggestion query failed:', err.message);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  const handleSelect = (item) => {
    isSelectedRef.current = true;
    setShowDropdown(false);
    setSuggestions([]);
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleClear = () => {
    if (onChange) onChange('');
    if (onSelect) onSelect(null);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-bold text-theme-primary uppercase tracking-wider">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {selectedCoords && typeof selectedCoords.lat === 'number' && (
            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
              <Check className="h-3 w-3" />
              <span>GPS Verified ({selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)})</span>
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <div className="absolute top-3 left-3 flex items-start pointer-events-none text-theme-muted">
          <MapPin className="h-5 w-5 text-theme-accent" />
        </div>
        <textarea
          id={id}
          required={required}
          rows={2}
          value={value || ''}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          className="block w-full pl-10 pr-16 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm transition-all"
          placeholder={placeholder}
        />

        <div className="absolute top-2.5 right-3 flex items-center space-x-1">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-theme-accent" />
          )}
          {value && value.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-theme-muted hover:text-theme-primary hover:bg-theme-surface transition-colors"
              title="Clear address"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-theme-card border border-theme rounded-2xl shadow-theme-lg overflow-hidden max-h-60 overflow-y-auto divide-y divide-theme animate-in fade-in duration-150">
          <div className="px-3 py-1.5 bg-theme-elevated/80 text-[10px] uppercase tracking-wider font-bold text-theme-muted flex items-center justify-between">
            <span>Verified Places (Nominatim)</span>
            <span>Click to select &amp; geocode</span>
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={item.placeId || idx}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-theme-elevated transition-colors flex items-start space-x-2.5 group"
            >
              <MapPin className="h-4 w-4 text-theme-muted group-hover:text-theme-accent mt-0.5 flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <p className="text-xs font-semibold text-theme-primary truncate">
                  {item.displayName.split(',')[0]}
                </p>
                <p className="text-[11px] text-theme-muted truncate">
                  {item.displayName.split(',').slice(1).join(',').trim()}
                </p>
              </div>
              <span className="text-[9px] font-mono font-bold text-theme-accent bg-theme-accent-light px-1.5 py-0.5 rounded border border-theme-accent self-center flex-shrink-0">
                Select
              </span>
            </button>
          ))}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-theme-muted">{helperText}</p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
