import React from 'react';
import { Plus, Minus } from 'lucide-react';

// ─── Shared service-icon lookup (local assets only) ─────────────────────────
const getServiceIcon = (name = '', category = '') => {
  const term = (name + ' ' + category).toLowerCase();
  if (term.includes('dry') || term.includes('iron') || term.includes('press')) {
    return '/icon-iron.png';
  }
  if (term.includes('shoe') || term.includes('curtain') || term.includes('carpet')) {
    return '/icon-laundry-basket.png';
  }
  return '/icon-washing-machine.png';
};

const ServiceCard = ({ service, onAdd, onRemove, quantity = 0, compact = false }) => {
  const { name, category, pricePerUnit, unit, description } = service;
  const iconSrc = getServiceIcon(name, category);

  /* ── Compact variant (used inside SchedulePickup cart list) ────────────── */
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3.5 bg-theme-card rounded-xl border border-theme hover:border-theme-accent transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-theme-elevated border border-theme flex items-center justify-center flex-shrink-0 p-1.5">
            <img src={iconSrc} alt={name} className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="font-semibold text-theme-primary text-sm">{name}</h4>
            <p className="text-xs text-theme-muted">₹{pricePerUnit} / {unit}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {quantity > 0 ? (
            <div className="flex items-center bg-theme-elevated border border-theme rounded-lg p-1">
              <button
                type="button"
                onClick={onRemove}
                className="p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-md transition-colors"
                aria-label={`Decrease quantity of ${name}`}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-3 text-xs font-bold text-theme-primary">{quantity}</span>
              <button
                type="button"
                onClick={onAdd}
                className="p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-md transition-colors"
                aria-label={`Increase quantity of ${name}`}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="px-3 py-1.5 bg-theme-accent text-[var(--accent-text)] rounded-lg text-xs font-bold transition-all theme-btn-hover"
            >
              Add
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── Full card variant (Services page grid) ────────────────────────────── */
  return (
    <div className="bg-theme-card rounded-2xl border border-theme hover:border-theme-accent theme-card-hover shadow-theme-sm transition-all duration-300 overflow-hidden flex flex-col h-full group">
      <div className="p-6 flex flex-col flex-grow">
        {/* Icon + category badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="bg-theme-elevated group-hover:bg-theme-accent-light p-3 w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300 border border-theme">
            <img src={iconSrc} alt={name} className="w-8 h-8 object-contain" />
          </div>
          {category && (
            <span className="text-[10px] font-bold tracking-wider text-theme-accent bg-theme-accent-light border border-theme-accent px-2 py-1 rounded-full uppercase">
              {category}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-theme-primary group-hover:text-theme-accent transition-colors duration-300 mb-2 font-poppins">
          {name}
        </h3>

        <p className="text-sm text-theme-muted line-clamp-2 mb-4 flex-grow">
          {description || 'Professional fabric care service tailored to prolong the lifespan of your apparel.'}
        </p>

        {/* Price + action */}
        <div className="border-t border-theme pt-4 flex items-center justify-between mt-auto">
          <div>
            <span className="text-2xl font-black text-theme-primary">₹{pricePerUnit}</span>
            <span className="text-xs text-theme-muted"> / {unit}</span>
          </div>

          <div>
            {quantity > 0 ? (
              <div className="flex items-center bg-theme-elevated border border-theme rounded-xl p-1.5">
                <button
                  type="button"
                  onClick={onRemove}
                  className="p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-md transition-colors"
                  aria-label={`Decrease quantity of ${name}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 font-bold text-theme-primary">{quantity}</span>
                <button
                  type="button"
                  onClick={onAdd}
                  className="p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-md transition-colors"
                  aria-label={`Increase quantity of ${name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAdd}
                className="flex items-center space-x-1.5 px-4 py-2 bg-theme-elevated hover:bg-theme-accent hover:text-white border border-theme text-theme-primary rounded-xl text-sm font-semibold transition-all duration-200 theme-btn-hover"
              >
                <Plus className="h-4 w-4 text-theme-accent group-hover:text-white" />
                <span>Add to Order</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
