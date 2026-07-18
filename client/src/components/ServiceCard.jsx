import React from 'react';
import { Plus, Minus } from 'lucide-react';

// ─── Shared service-icon lookup (no emoji, local assets only) ──────────────
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
      <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-navy-100 hover:border-gold-200 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center flex-shrink-0 p-1.5">
            <img src={iconSrc} alt={name} className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="font-semibold text-navy-900 text-sm">{name}</h4>
            <p className="text-xs text-navy-500">₹{pricePerUnit} / {unit}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {quantity > 0 ? (
            <div className="flex items-center bg-navy-50 border border-navy-200 rounded-lg p-1">
              <button
                type="button"
                onClick={onRemove}
                className="p-1 text-navy-600 hover:bg-navy-200 rounded-md transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-3 text-xs font-bold text-navy-900">{quantity}</span>
              <button
                type="button"
                onClick={onAdd}
                className="p-1 text-navy-600 hover:bg-navy-200 rounded-md transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAdd}
              className="px-3 py-1.5 bg-navy-900 hover:bg-navy-850 text-white rounded-lg text-xs font-bold transition-all"
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
    <div className="bg-white rounded-2xl border border-navy-100 hover:border-gold-300 hover:shadow-xl hover:shadow-navy-900/5 transition-all duration-300 overflow-hidden flex flex-col h-full group">
      <div className="p-6 flex flex-col flex-grow">
        {/* Icon + category badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="bg-navy-50 group-hover:bg-gold-50 p-3 w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300">
            <img src={iconSrc} alt={name} className="w-8 h-8 object-contain" />
          </div>
          {category && (
            <span className="text-[10px] font-bold tracking-wider text-gold-700 bg-gold-50 border border-gold-100 px-2 py-1 rounded-full uppercase">
              {category}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-navy-900 group-hover:text-gold-600 transition-colors duration-300 mb-2 font-poppins">
          {name}
        </h3>

        <p className="text-sm text-navy-500 line-clamp-2 mb-4 flex-grow">
          {description || 'Professional fabric care service tailored to prolong the lifespan of your apparel.'}
        </p>

        {/* Price + action */}
        <div className="border-t border-navy-50 pt-4 flex items-center justify-between mt-auto">
          <div>
            <span className="text-2xl font-black text-navy-900">₹{pricePerUnit}</span>
            <span className="text-xs text-navy-400"> / {unit}</span>
          </div>

          <div>
            {quantity > 0 ? (
              <div className="flex items-center bg-navy-50 border border-navy-200 rounded-xl p-1.5">
                <button
                  type="button"
                  onClick={onRemove}
                  className="p-1 text-navy-600 hover:bg-navy-200 rounded-md transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 font-bold text-navy-900">{quantity}</span>
                <button
                  type="button"
                  onClick={onAdd}
                  className="p-1 text-navy-600 hover:bg-navy-200 rounded-md transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onAdd}
                className="flex items-center space-x-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-850 hover:shadow-md hover:shadow-navy-900/10 text-white rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <Plus className="h-4 w-4 text-gold-500" />
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
