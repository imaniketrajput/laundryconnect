import React from 'react';

/**
 * StarRating
 *  - Interactive mode (default): clicking a star calls onChange(value)
 *  - Read-only mode: pass readOnly={true} — stars are not clickable
 *
 * Props:
 *   value      {number}   current rating (1-5, or 0/null = none selected)
 *   onChange   {fn}       called with (newValue: number) — omit in read-only
 *   readOnly   {boolean}  disable interaction
 *   size       {string}   tailwind text-size class, default 'text-2xl'
 */
const StarRating = ({ value = 0, onChange, readOnly = false, size = 'text-2xl' }) => {
  return (
    <div className="flex items-center gap-0.5" role={readOnly ? 'img' : 'group'} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange && onChange(star)}
            className={`
              ${size} leading-none transition-transform duration-100
              ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95 focus:outline-none'}
              ${filled ? 'text-gold-500' : 'text-navy-200'}
            `}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            {filled ? '★' : '☆'}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
