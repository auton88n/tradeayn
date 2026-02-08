import { Skeleton } from '@/components/ui/skeleton';

export const LandingPageSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Nav bar */}
    <div className="flex items-center justify-between px-6 py-4">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>

    {/* Hero */}
    <div className="flex flex-col items-center gap-6 px-6 pt-20 pb-16 max-w-4xl mx-auto">
      <Skeleton className="h-12 w-3/4 max-w-xl" />
      <Skeleton className="h-6 w-2/3 max-w-md" />
      <Skeleton className="h-5 w-1/2 max-w-sm" />
      <div className="flex gap-4 mt-4">
        <Skeleton className="h-12 w-36 rounded-lg" />
        <Skeleton className="h-12 w-36 rounded-lg" />
      </div>
    </div>

    {/* Service cards grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 max-w-6xl mx-auto pb-20">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} className="h-48 rounded-xl" />
      ))}
    </div>
  </div>
);

export const SettingsSkeleton = () => (
  <div className="min-h-screen bg-background p-4 md:p-6 pt-6 md:pt-8">
    <div className="max-w-5xl mx-auto">
      {/* Back button + title */}
      <div className="mb-6 md:mb-8">
        <Skeleton className="h-8 w-20 mb-3" />
        <Skeleton className="h-9 w-48 mb-6" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      {/* Tab bar */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
        <Skeleton className="h-10 w-32 rounded-md mt-4" />
      </div>
    </div>
  </div>
);

export const EngineeringSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Top toolbar */}
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2 ml-auto">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>

    {/* Calculator selector strip */}
    <div className="flex gap-2 px-4 py-3 overflow-hidden">
      {[1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-9 w-28 rounded-full flex-shrink-0" />
      ))}
    </div>

    {/* Split panel */}
    <div className="flex flex-col md:flex-row gap-4 p-4 flex-1">
      {/* Input fields */}
      <div className="flex-1 space-y-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>

      {/* 3D preview area */}
      <div className="flex-1">
        <Skeleton className="h-80 md:h-full w-full rounded-xl" />
      </div>
    </div>
  </div>
);

export const ServicePageSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Nav */}
    <div className="flex items-center justify-between px-6 py-4">
      <Skeleton className="h-8 w-32" />
      <div className="flex gap-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>

    {/* Hero banner */}
    <div className="flex flex-col items-center gap-4 px-6 pt-16 pb-12 max-w-3xl mx-auto">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-12 w-40 rounded-lg mt-4" />
    </div>

    {/* Feature cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 max-w-5xl mx-auto pb-16">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-3 p-6 rounded-xl border border-border">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>

    {/* CTA section */}
    <div className="flex flex-col items-center gap-4 py-12">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-12 w-44 rounded-lg" />
    </div>
  </div>
);
