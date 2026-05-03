export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      {/* Thumbnail */}
      <div className="h-40 skeleton" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="h-3 w-20 skeleton" />
          <div className="h-4 w-full skeleton" />
          <div className="h-4 w-4/5 skeleton" />
        </div>
        <div className="space-y-1">
          <div className="h-3 w-full skeleton" />
          <div className="h-3 w-5/6 skeleton" />
        </div>
        <div className="h-3 w-28 skeleton" />
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="h-5 w-14 skeleton" />
          <div className="h-3 w-24 skeleton" />
        </div>
      </div>
    </div>
  );
}
