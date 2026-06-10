export default function RootLoading() {
  return (
    <div className="min-h-screen bg-trail-50 px-5 py-6 text-ink">
      <div className="mx-auto max-w-5xl animate-pulse space-y-5">
        <div className="h-7 w-28 rounded-lg bg-stone-200" />
        <div className="h-44 rounded-lg bg-white shadow-soft" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-28 rounded-lg bg-white shadow-soft" />
          <div className="h-28 rounded-lg bg-white shadow-soft" />
        </div>
      </div>
    </div>
  );
}
