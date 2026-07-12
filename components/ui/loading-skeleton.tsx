export function FileGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex-1 p-5 overflow-auto">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card/50"
          >
            <div className="size-12 rounded-lg bg-secondary/50 animate-pulse" />
            <div className="h-3 w-24 rounded bg-secondary/50 animate-pulse" />
            <div className="h-2 w-16 rounded bg-secondary/30 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FileListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="flex items-center h-9 px-5 border-b border-border">
        <div className="h-2 w-24 rounded bg-secondary/50 animate-pulse" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center h-11 px-5 border-b border-border/50"
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="size-4 rounded bg-secondary/50 animate-pulse" />
            <div className="h-3 w-32 rounded bg-secondary/50 animate-pulse" />
          </div>
          <div className="h-2.5 w-20 rounded bg-secondary/30 animate-pulse" />
          <div className="h-2.5 w-16 rounded bg-secondary/30 animate-pulse ml-4" />
          <div className="h-2.5 w-12 rounded bg-secondary/30 animate-pulse ml-4" />
        </div>
      ))}
    </div>
  );
}
