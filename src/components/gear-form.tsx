"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";
import { statusLabels, weightTypeLabels } from "@/lib/i18n/labels";
import type {
  GearCategory,
  GearProduct,
  GearSubcategory,
  UserGear
} from "@/lib/types";

type GearFormProps = {
  categories: GearCategory[];
  subcategories: GearSubcategory[];
  products: GearProduct[];
  action: (formData: FormData) => void | Promise<void>;
  gear?: UserGear;
  error?: string;
};

export function GearForm({
  categories,
  subcategories,
  products,
  action,
  gear,
  error
}: GearFormProps) {
  const initialCategoryId = gear?.category_id ?? categories[0]?.id ?? "";
  const initialSubcategoryId = gear?.subcategory_id ?? "";
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [subcategoryId, setSubcategoryId] = useState(initialSubcategoryId);
  const [productId, setProductId] = useState(gear?.product_id ?? "");
  const [name, setName] = useState(gear?.name ?? "");
  const [brand, setBrand] = useState(gear?.brand ?? "");
  const [model, setModel] = useState(gear?.model ?? "");
  const [weightGrams, setWeightGrams] = useState(
    String(gear?.weight_grams ?? 0)
  );
  const [msrpJpy, setMsrpJpy] = useState(String(gear?.msrp_jpy ?? ""));
  const [purchasePriceJpy, setPurchasePriceJpy] = useState(
    String(gear?.purchase_price_jpy ?? "")
  );
  const [size, setSize] = useState(gear?.size ?? "");
  const [volume, setVolume] = useState(gear?.volume ?? "");
  const [capacity, setCapacity] = useState(gear?.capacity ?? "");

  const subcategoriesForCategory = useMemo(
    () => subcategories.filter((item) => item.category_id === categoryId),
    [categoryId, subcategories]
  );

  function applyProduct(rawValue: string) {
    setName(rawValue);
    const product = products.find((item) =>
      getProductSearchValues(item).some(
        (value) => normalize(value) === normalize(rawValue)
      )
    );

    if (!product) {
      setProductId("");
      return;
    }

    setProductId(product.id);
    setCategoryId(product.category_id);
    setSubcategoryId(product.subcategory_id ?? "");
    setName(product.name_ja ?? product.model);
    setBrand(product.brand);
    setModel(product.model);
    setWeightGrams(String(product.weight_grams ?? 0));
    setMsrpJpy(String(product.msrp_jpy ?? ""));
    setPurchasePriceJpy(String(product.msrp_jpy ?? ""));
    setSize(product.size ?? "");
    setVolume(product.volume ?? "");
    setCapacity(product.capacity ?? "");
  }

  return (
    <form action={action} className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <input type="hidden" name="product_id" value={productId} />

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">製品名</span>
            <input
              name="name"
              required
              list="gear-product-options"
              value={name}
              onChange={(event) => applyProduct(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              placeholder="例: ストームクルーザー ジャケット"
            />
            <datalist id="gear-product-options">
              {products.flatMap((product) =>
                getProductSearchValues(product).map((value) => (
                  <option key={`${product.id}-${value}`} value={value} />
                ))
              )}
            </datalist>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">ブランド</span>
              <input
                name="brand"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                placeholder="例: mont-bell"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">モデル</span>
              <input
                name="model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                placeholder="例: Storm Cruiser"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">カテゴリー</span>
              <select
                name="category_id"
                required
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setSubcategoryId("");
                }}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name_ja}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">サブカテゴリー</span>
              <select
                name="subcategory_id"
                value={subcategoryId}
                onChange={(event) => setSubcategoryId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              >
                <option value="">未設定</option>
                {subcategoriesForCategory.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name_ja}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">重量（g）</span>
            <input
              name="weight_grams"
              type="number"
              min="0"
              step="1"
              required
              value={weightGrams}
              onChange={(event) => setWeightGrams(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">MSRP（円）</span>
            <input
              name="msrp_jpy"
              type="number"
              min="0"
              step="1"
              value={msrpJpy}
              onChange={(event) => setMsrpJpy(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">購入価格（円）</span>
            <input
              name="purchase_price_jpy"
              type="number"
              min="0"
              step="1"
              value={purchasePriceJpy}
              onChange={(event) => setPurchasePriceJpy(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">サイズ</span>
            <input
              name="size"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              placeholder="例: L"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">容量</span>
            <input
              name="volume"
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              placeholder="例: 55L"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">対応量</span>
            <input
              name="capacity"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              placeholder="例: 2人用"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3">
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

          <label className="block">
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
            name="memo"
            rows={3}
            defaultValue={gear?.memo ?? ""}
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

function getProductSearchValues(product: GearProduct) {
  return [
    product.name_ja,
    product.model,
    `${product.brand} ${product.model}`,
    ...(product.gear_product_aliases?.map((item) => item.alias) ?? [])
  ].filter((value): value is string => Boolean(value));
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, "");
}
