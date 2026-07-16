import React from "react";

const ProfileSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto pb-12 relative z-10 space-y-8 animate-pulse">
      {/* Header Summary Banner Skeleton */}
      <div className="bg-white border border-slate-200/85 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-6 w-48 bg-slate-100 rounded-lg" />
          <div className="h-4 w-36 bg-slate-100 rounded-lg" />
          <div className="h-3 w-28 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Nav menu skeleton */}
        <div className="lg:col-span-5 space-y-4">
          <div className="h-3 w-24 bg-slate-100 rounded-sm ml-1" />
          <div className="bg-white border border-slate-200 rounded-3xl p-3 space-y-2">
            <div className="h-14 w-full bg-slate-100 rounded-2xl" />
            <div className="h-14 w-full bg-slate-100 rounded-2xl" />
            <div className="h-14 w-full bg-slate-100 rounded-2xl" />
          </div>
        </div>

        {/* Right Active tab body skeleton */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 min-h-[420px] flex flex-col justify-between">
          <div className="space-y-6 w-full">
            <div className="space-y-2">
              <div className="h-5 w-36 bg-slate-100 rounded-lg" />
              <div className="h-3.5 w-56 bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <div className="h-3 w-16 bg-slate-100 rounded-sm" />
                <div className="h-11 w-full bg-slate-100 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-slate-100 rounded-sm" />
                <div className="h-11 w-full bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-6 border-t border-slate-100">
            <div className="h-11 w-32 bg-slate-100 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
