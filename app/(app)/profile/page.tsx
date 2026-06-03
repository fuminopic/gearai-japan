import { requireUser } from "@/lib/data/gear";

export default async function ProfilePage() {
  const { user } = await requireUser();

  return (
    <div className="rounded-lg bg-white p-6 shadow-soft">
      <p className="text-sm font-semibold text-forest-700">プロフィール</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">自分</h1>
      <p className="mt-4 text-sm text-stone-500">{user.email}</p>
    </div>
  );
}
