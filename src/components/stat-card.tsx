import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-ink">{value}</p>
        </div>
        {icon ? (
          <div className="rounded-lg bg-forest-50 p-3 text-forest-700">{icon}</div>
        ) : null}
      </div>
      {detail ? <p className="mt-4 text-sm text-stone-500">{detail}</p> : null}
    </section>
  );
}
