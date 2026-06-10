export default function AppLoading() {
  return <AppLoadingFallback />;
}

export function AppLoadingFallback() {
  return (
    <div className="space-y-5 animate-pulse">
      <section className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded-lg bg-forest-100" />
          <div className="h-9 w-36 rounded-lg bg-stone-200" />
        </div>
        <div className="h-11 w-20 rounded-lg bg-forest-100" />
      </section>

      <section className="h-48 rounded-lg bg-white shadow-soft" />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="h-28 rounded-lg bg-white shadow-soft" />
        <div className="h-28 rounded-lg bg-white shadow-soft" />
        <div className="h-28 rounded-lg bg-white shadow-soft" />
      </section>

      <section className="space-y-2 rounded-lg bg-white p-5 shadow-soft">
        <div className="h-4 w-24 rounded-lg bg-stone-200" />
        <div className="h-3 w-full rounded-lg bg-stone-100" />
        <div className="h-3 w-2/3 rounded-lg bg-stone-100" />
      </section>
    </div>
  );
}
