export default function IdeasLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto px-4 pt-[calc(4rem+env(safe-area-inset-top,0px)+1rem)] pb-16 sm:pb-24 sm:pt-[calc(4rem+env(safe-area-inset-top,0px)+1.25rem)]">
        <div className="mx-auto mb-10 max-w-3xl animate-pulse text-center">
          <div className="mx-auto h-14 max-w-xs rounded-lg bg-muted sm:h-16" />
          <div className="mx-auto mt-4 h-5 max-w-lg rounded bg-muted" />
        </div>
        <div className="mx-auto mb-8 max-w-5xl animate-pulse">
          <div className="h-12 rounded-xl bg-muted" />
        </div>
        <div className="mx-auto mb-10 flex max-w-5xl flex-wrap gap-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-20 rounded-full bg-muted" />
          ))}
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border bg-card/40 p-6">
              <div className="mb-4 flex justify-between">
                <div className="h-6 w-20 rounded-full bg-muted" />
                <div className="h-6 w-14 rounded-full bg-muted" />
              </div>
              <div className="h-6 max-w-[85%] rounded bg-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-3 rounded bg-muted" />
                <div className="h-3 rounded bg-muted" />
                <div className="h-3 max-w-[70%] rounded bg-muted" />
              </div>
              <div className="mt-6 flex justify-between">
                <div className="h-3 w-16 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
