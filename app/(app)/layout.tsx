import { AppNav } from "@/components/app-nav";
import { requireUser } from "@/lib/data/gear";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-screen bg-trail-50 pb-32 text-ink">
      <AppNav />
      <main className="mx-auto max-w-5xl px-5 pb-32 pt-6 md:ml-24 md:pb-10 md:pt-8">
        {children}
      </main>
    </div>
  );
}
