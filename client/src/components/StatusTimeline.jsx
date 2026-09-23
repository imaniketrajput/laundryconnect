import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

const STEPS = [
  { status: 'Placed', label: 'Order Placed', desc: 'Order received by us' },
  { status: 'PickedUp', label: 'Picked Up', desc: 'Garments collected' },
  { status: 'Washing', label: 'Processing', desc: 'In cleaning process' },
  { status: 'Ready', label: 'Ready', desc: 'Cleaned & packaged' },
  { status: 'OutForDelivery', label: 'Out for Delivery', desc: 'Rider is on the way' },
  { status: 'Delivered', label: 'Delivered', desc: 'Returned to doorstep' }
];

const StatusTimeline = ({ currentStatus, statusHistory = [] }) => {
  const isCancelled = currentStatus === 'Cancelled';
  const currentIndex = STEPS.findIndex(step => step.status === currentStatus);

  const getStatusTime = (statusName) => {
    const record = statusHistory.find(h => h.status === statusName);
    if (!record) return null;
    return new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isCancelled) {
    return (
      <div className="flex items-center space-x-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-red-500">
        <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-base">Order Cancelled</h4>
          <p className="text-sm opacity-90 mt-0.5">This order has been cancelled and will not be processed.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Horizontal Stepper (hidden on mobile) */}
      <div className="hidden md:block">
        <div className="flex justify-between items-center relative">
          {/* Progress bar background */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-theme-elevated -translate-y-1/2 z-0"></div>
          {/* Progress bar filled */}
          <div 
            className="absolute top-1/2 left-0 h-1 bg-theme-accent -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%` }}
          ></div>

          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const timeStr = getStatusTime(step.status);

            return (
              <div key={step.status} className="flex flex-col items-center relative z-10 w-32">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-theme-accent border-theme-accent text-[var(--accent-text)] shadow-theme-accent' 
                      : isCurrent 
                        ? 'bg-theme-card border-theme-accent text-theme-accent scale-110 shadow-lg ring-4 ring-theme-accent-light' 
                        : 'bg-theme-card border-theme text-theme-muted'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[3]" />
                  ) : (
                    <span className="text-sm font-bold">{idx + 1}</span>
                  )}
                </div>
                <div className="text-center mt-3">
                  <p className={`text-xs font-bold font-poppins ${isCurrent ? 'text-theme-primary scale-105' : 'text-theme-muted'}`}>
                    {step.label}
                  </p>
                  {timeStr && (
                    <p className="text-[10px] font-bold text-theme-accent mt-0.5">{timeStr}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Stepper (hidden on desktop) */}
      <div className="block md:hidden">
        <div className="relative pl-6 border-l-2 border-theme ml-3 space-y-8">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const timeStr = getStatusTime(step.status);

            return (
              <div key={step.status} className="relative">
                {/* Stepper Dot */}
                <div 
                  className={`absolute -left-[35px] top-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-theme-accent border-theme-accent text-[var(--accent-text)]' 
                      : isCurrent 
                        ? 'bg-theme-card border-theme-accent text-theme-accent scale-105 shadow-md ring-2 ring-theme-accent-light' 
                        : 'bg-theme-card border-theme text-theme-muted'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3 stroke-[3]" />
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>
                <div>
                  <h4 className={`text-sm font-bold font-poppins ${isCurrent ? 'text-theme-primary' : 'text-theme-muted'}`}>
                    {step.label}
                  </h4>
                  <p className="text-xs text-theme-muted mt-0.5">{step.desc}</p>
                  {timeStr && (
                    <p className="text-[10px] font-bold text-theme-accent mt-1">{timeStr}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatusTimeline;
