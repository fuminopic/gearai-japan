"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { GearImageViewer } from "@/components/gear-image-viewer";
import { SubmitButton } from "@/components/submit-button";
import { statusLabels, weightTypeLabels } from "@/lib/i18n/labels";
import type {
  GearCategory,
  GearProduct,
  GearSubcategory,
  UserGear
} from "@/lib/types";
import { calculateSavingsJpy, parsePositiveNumber } from "@/lib/utils/asset";
import { formatJpy } from "@/lib/utils/format";

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
  const initialCategoryId = gear?.category_id ?? "";
  const initialSubcategoryId = gear?.subcategory_id ?? "";
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [subcategoryId, setSubcategoryId] = useState(initialSubcategoryId);
  const [productId, setProductId] = useState(gear?.product_id ?? "");
  const [query, setQuery] = useState(gear?.name ?? "");
  const [name, setName] = useState(gear?.name ?? "");
  const [brand, setBrand] = useState(gear?.brand ?? "");
  const [model, setModel] = useState(gear?.model ?? "");
  const [officialWeightGrams, setOfficialWeightGrams] = useState(
    String(gear?.official_weight_grams ?? gear?.weight_grams ?? "")
  );
  const [measuredWeightGrams, setMeasuredWeightGrams] = useState(
    String(gear?.measured_weight_grams ?? "")
  );
  const [msrpJpy, setMsrpJpy] = useState(String(gear?.msrp_jpy ?? ""));
  const [purchasePriceJpy, setPurchasePriceJpy] = useState(
    String(gear?.purchase_price_jpy ?? "")
  );
  const [status, setStatus] = useState(gear?.status ?? "owned");
  const [purchaseDate, setPurchaseDate] = useState(gear?.purchase_date ?? "");
  const [size, setSize] = useState(gear?.size ?? "");
  const [volume, setVolume] = useState(gear?.volume ?? "");
  const [color, setColor] = useState(gear?.color ?? "");
  const [material, setMaterial] = useState(gear?.material ?? "");
  const [capacity, setCapacity] = useState(gear?.capacity ?? "");
  const [officialUrl, setOfficialUrl] = useState(gear?.official_url ?? "");
  const [imageUrl, setImageUrl] = useState(gear?.image_url ?? "");

  const subcategoriesForCategory = useMemo(
    () => subcategories.filter((item) => item.category_id === categoryId),
    [categoryId, subcategories]
  );
  const categoryOptions = useMemo(() => {
    if (
      !gear?.gear_categories ||
      categories.some((category) => category.id === gear.category_id)
    ) {
      return categories;
    }

    return [
      ...categories,
      {
        id: gear.category_id,
        name_ja: gear.gear_categories.name_ja,
        name_en: gear.gear_categories.name_en,
        sort_order: Number.MAX_SAFE_INTEGER,
        is_default: false,
        created_at: gear.created_at
      }
    ];
  }, [categories, gear]);
  const subcategoryOptions = useMemo(() => {
    if (
      !gear?.subcategory_id ||
      !gear.gear_subcategories ||
      subcategoriesForCategory.some(
        (subcategory) => subcategory.id === gear.subcategory_id
      )
    ) {
      return subcategoriesForCategory;
    }

    return [
      ...subcategoriesForCategory,
      {
        id: gear.subcategory_id,
        category_id: gear.category_id,
        name_ja: gear.gear_subcategories.name_ja,
        name_en: gear.gear_subcategories.name_en,
        sort_order: Number.MAX_SAFE_INTEGER,
        created_at: gear.created_at
      }
    ];
  }, [gear, subcategoriesForCategory]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      return products.slice(0, 12);
    }

    return products
      .filter((product) => matchesProductQuery(product, query));
  }, [products, query]);
  const savingsJpy = calculateSavingsJpy(
    parsePositiveNumber(msrpJpy),
    parsePositiveNumber(purchasePriceJpy)
  );

  function handleProductQuery(value: string) {
    setQuery(value);
    setName(value);
    setProductId("");
  }

  function applyProduct(product: GearProduct) {
    const productName = product.name_ja ?? product.model;
    setProductId(product.id);
    setCategoryId(product.category_id);
    setSubcategoryId(product.subcategory_id ?? "");
    setQuery(productName);
    setName(productName);
    setBrand(product.brand);
    setModel(product.model);
    setOfficialWeightGrams(
      String(product.official_weight_grams ?? product.weight_grams ?? "")
    );
    setMeasuredWeightGrams("");
    setMsrpJpy(String(product.msrp_jpy ?? ""));
    setPurchasePriceJpy("");
    setStatus("owned");
    setSize(product.size ?? "");
    setVolume(product.volume ?? "");
    setColor(product.color ?? "");
    setMaterial(product.material ?? "");
    setCapacity(product.capacity ?? "");
    setOfficialUrl(product.official_url ?? "");
    setImageUrl(product.image_url ?? "");
  }

  return (
    <form action={action} className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="image_url" value={imageUrl} />

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div
          className={
            imageUrl
              ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start"
              : "grid gap-4"
          }
        >
          <div className="min-w-0">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">製品名</span>
              <input
                name="name"
                required
                value={query}
                onChange={(event) => handleProductQuery(event.target.value)}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                placeholder="例：Mountain Shot 2"
                autoComplete="off"
              />
            </label>

            {filteredProducts.length > 0 ? (
              <div className="mt-4 grid gap-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => applyProduct(product)}
                    className="grid grid-cols-[1fr_auto] gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-left transition hover:border-forest-500 hover:bg-white"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {product.name_ja ?? product.model}
                      </span>
                      <span className="mt-1 block truncate text-xs text-stone-500">
                        {[product.brand, product.model].filter(Boolean).join(" / ")}
                      </span>
                    </span>
                    <span className="text-right text-xs text-stone-500">
                      <span className="block">
                        {formatWeightGrams(
                          product.official_weight_grams ?? product.weight_grams
                        )}
                      </span>
                      <span className="mt-1 block">
                        {product.msrp_jpy ? formatJpy(product.msrp_jpy) : "-"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {imageUrl ? (
            <div>
              <p className="mb-2 text-sm font-medium text-stone-700">製品画像</p>
              <GearImageViewer
                src={imageUrl}
                alt={name || "製品画像"}
                className="h-56 sm:h-64 lg:h-72"
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">資産情報</h2>
          </div>
          <div className="rounded-lg bg-forest-50 px-4 py-3 text-sm">
            <p className="font-medium text-stone-500">節約額</p>
            <p className="mt-1 text-xl font-semibold text-forest-800">
              {savingsJpy === null ? "-" : formatJpy(savingsJpy)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">
              メーカー希望小売価格（円）
            </span>
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

          <label className="block">
            <span className="text-sm font-medium text-stone-700">ステータス</span>
            <select
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
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
            <span className="text-sm font-medium text-stone-700">購入日</span>
            <input
              name="purchase_date"
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            />
          </label>
        </div>

        <dl className="mt-4 grid gap-3 rounded-lg bg-stone-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-stone-500">MSRP</dt>
            <dd className="mt-1 font-semibold text-ink">
              {parsePositiveNumber(msrpJpy) === null
                ? "-"
                : formatJpy(Number(parsePositiveNumber(msrpJpy)))}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">購入価格</dt>
            <dd className="mt-1 font-semibold text-ink">
              {parsePositiveNumber(purchasePriceJpy) === null
                ? "-"
                : formatJpy(Number(parsePositiveNumber(purchasePriceJpy)))}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">所有状態</dt>
            <dd className="mt-1 font-semibold text-ink">{statusLabels[status]}</dd>
          </div>
        </dl>

        <label className="mt-3 block">
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

      <details className="rounded-lg bg-white p-5 shadow-soft">
        <summary className="cursor-pointer text-sm font-semibold text-forest-700">
          詳細設定
        </summary>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">ブランド</span>
              <input
                name="brand"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                placeholder="例：finetrack"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">モデル</span>
              <input
                name="model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                placeholder="例：MINI2"
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
                <option value="">カテゴリーを選択</option>
                {categoryOptions.map((category) => (
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
                <option value="">サブカテゴリーを選択</option>
                {subcategoryOptions.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name_ja}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">公式重量（g）</span>
              <input
                name="official_weight_grams"
                type="number"
                min="0"
                step="1"
                value={officialWeightGrams}
                onChange={(event) => setOfficialWeightGrams(event.target.value)}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                placeholder="例：398"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">実測重量（g）</span>
              <input
                name="measured_weight_grams"
                type="number"
                min="0"
                step="1"
                value={measuredWeightGrams}
                onChange={(event) => setMeasuredWeightGrams(event.target.value)}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                placeholder="例：398"
              />
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
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-stone-700">サイズ</span>
            <input
              name="size"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              placeholder="例：M"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">容量</span>
            <input
              name="volume"
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              placeholder="例：25-35L"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">対応人数</span>
            <input
              name="capacity"
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              placeholder="例：2人用"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">カラー</span>
            <input
              name="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">素材</span>
            <input
              name="material"
              value={material}
              onChange={(event) => setMaterial(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-stone-700">公式URL</span>
            <input
              name="official_url"
              value={officialUrl}
              onChange={(event) => setOfficialUrl(event.target.value)}
              className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
            />
          </label>
          </div>
        </div>
      </details>

      <div className="flex flex-col gap-3 pb-4 sm:flex-row">
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
    product.brand,
    product.capacity,
    `${product.brand} ${product.model}`,
    ...(product.gear_product_aliases?.map((item) => item.alias) ?? [])
  ].filter((value): value is string => Boolean(value));
}

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, "");
}

function formatWeightGrams(value: number | null | undefined) {
  return typeof value === "number" ? `${value}g` : "-";
}

function matchesProductQuery(product: GearProduct, query: string) {
  const values = getProductSearchValues(product);
  const tokens = query
    .toLocaleLowerCase()
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean);

  return tokens.every((token) => matchesProductToken(product, values, token));
}

function matchesProductToken(
  product: GearProduct,
  values: string[],
  normalizedToken: string
) {
  if (/^\d+$/.test(normalizedToken)) {
    return values.some((value) => normalize(value).includes(normalizedToken));
  }

  if (normalizedToken === "st" || normalizedToken === "sod") {
    return normalize(product.model).startsWith(normalizedToken);
  }

  return values.some((value) => normalize(value).includes(normalizedToken));
}
