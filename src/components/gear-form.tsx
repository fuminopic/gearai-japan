import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";
import { statusLabels, weightTypeLabels } from "@/lib/i18n/labels";
import type { GearCategory, UserGear } from "@/lib/types";

type GearFormProps = {
  categories: GearCategory[];
  action: (formData: FormData) => void | Promise<void>;
  gear?: UserGear;
  error?: string;
};

export function GearForm({ categories, action, gear, error }: GearFormProps) {
  return (
    <form action={action} className="space-y-5">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">装備名</span>
            <input
              name="name"
              required
              defaultValue={gear?.name}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              placeholder="例: ストームクルーザー ジャケット"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">ブランド</span>
            <input
              name="brand"
              defaultValue={gear?.brand ?? ""}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              placeholder="例: mont-bell"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">カテゴリー</span>
            <select
              name="category_id"
              required
              defaultValue={gear?.category_id ?? categories[0]?.id}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_ja}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">重量（g）</span>
            <input
              name="weight_g"
              type="number"
              min="0"
              step="0.1"
              required
              defaultValue={gear?.weight_g ?? 0}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">価格（円）</span>
            <input
              name="price_jpy"
              type="number"
              min="0"
              step="1"
              defaultValue={gear?.price_jpy ?? ""}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">ステータス</span>
            <select
              name="status"
              defaultValue={gear?.status ?? "owned"}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">重量タイプ</span>
            <select
              name="weight_type"
              defaultValue={gear?.weight_type ?? "base"}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            >
              {Object.entries(weightTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-stone-700">購入日</span>
            <input
              name="purchase_date"
              type="date"
              defaultValue={gear?.purchase_date ?? ""}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">メモ</span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={gear?.notes ?? ""}
            className="mt-2 w-full resize-none rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            placeholder="使用感、買い替え候補、注意点など"
          />
        </label>
      </section>

      <div className="flex gap-3 pb-4">
        <Link
          href="/gear"
          className="flex-1 rounded-lg border border-stone-200 bg-white px-5 py-3 text-center text-base font-semibold text-stone-700"
        >
          キャンセル
        </Link>
        <SubmitButton className="flex-1 rounded-lg bg-forest-700 px-5 py-3 text-base font-semibold text-white disabled:opacity-60">
          保存
        </SubmitButton>
      </div>
    </form>
  );
}

