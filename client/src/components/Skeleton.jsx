import React from 'react';

/**
 * Base Skeleton component with shimmer effect
 */
export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`skeleton-shimmer rounded-xl ${className}`}
      {...props}
    />
  );
};

/**
 * Order Card Skeleton for MyOrders page
 */
export const OrderSkeleton = () => {
  return (
    <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-theme">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
      </div>

      {/* Stepper skeleton */}
      <div className="py-2 space-y-4">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between items-center px-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-1.5">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* Items row */}
      <div className="bg-theme-elevated/50 p-4 rounded-2xl space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
};

/**
 * Service Card Skeleton for Services page grid
 */
export const ServiceCardSkeleton = () => {
  return (
    <div className="bg-theme-card rounded-2xl border border-theme p-6 flex flex-col h-full space-y-4">
      {/* Icon & Category Pill */}
      <div className="flex justify-between items-start">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>

      {/* Title & Description */}
      <div className="space-y-2 flex-grow pt-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
      </div>

      {/* Price & Button */}
      <div className="border-t border-theme pt-4 flex justify-between items-center">
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  );
};

/**
 * Grid of Service Card Skeletons
 */
export const ServiceGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Dashboard Skeleton (Admin & Partner)
 */
export const DashboardTableSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-theme-card p-6 rounded-3xl border border-theme flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="w-12 h-12 rounded-2xl" />
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-theme-card p-6 rounded-3xl border border-theme space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-theme">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-theme/50 gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Timeline Skeleton for TrackOrder page
 */
export const TimelineSkeleton = () => {
  return (
    <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-theme">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="py-6 space-y-6">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="grid grid-cols-6 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
