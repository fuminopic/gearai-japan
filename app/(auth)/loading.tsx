export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-trail-50 px-5 py-10 text-ink">
      <div className="mx-auto max-w-md animate-pulse space-y-5">
        <div className="space-y-2">
          <div className="h-8 w-28 rounded-lg bg-stone-200" />
          <div className="h-4 w-40 rounded-lg bg-forest-100" />
        </div>
        <div className="space-y-4 rounded-lg bg-white p-5 shadow-soft">
          <div className="h-12 rounded-lg bg-stone-100" />
          <div className="h-12 rounded-lg bg-stone-100" />
          <div className="h-12 rounded-lg bg-forest-100" />
        </div>
      </div>
    </div>
  );
}
