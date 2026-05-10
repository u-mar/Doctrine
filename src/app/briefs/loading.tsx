export default function BriefsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <div className="mx-auto mb-12 max-w-3xl animate-pulse text-center">
          <div className="mx-auto h-12 max-w-xs rounded-lg bg-muted sm:h-14" />
          <div className="mx-auto mt-4 h-5 max-w-md rounded bg-muted" />
        </div>
        <div className="mx-auto mb-8 max-w-4xl animate-pulse">
          <div className="h-12 rounded-xl bg-muted" />
        </div>
        <div className="mx-auto grid max-w-4xl gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-border bg-card/40 p-6">
              <div className="mb-4 flex gap-3">
                <div className="h-7 w-24 rounded-full bg-muted" />
                <div className="h-4 w-28 rounded bg-muted" />
              </div>
              <div className="h-8 max-w-lg rounded bg-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-4 rounded bg-muted" />
                <div className="h-4 max-w-[90%] rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
