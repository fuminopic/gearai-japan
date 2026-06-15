"use client";

import {
  Barcode,
  Camera,
  Check,
  ChevronRight,
  PackagePlus,
  Search,
  Sparkles
} from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SubmitButton } from "@/components/submit-button";
import {
  gearSubcategoryLabels,
  statusLabels,
  weightTypeLabels
} from "@/lib/i18n/labels";
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
  const [brandFilter, setBrandFilter] = useState("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
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
  const brandOptions = useMemo(() => {
    const brands = Array.from(new Set(products.map((product) => product.brand)))
      .filter(Boolean)
      .sort(compareProductBrands);

    return brands;
  }, [products]);
  const categorySortOrder = useMemo(() => {
    return new Map(categories.map((category, index) => [
      category.id,
      category.sort_order ?? index
    ]));
  }, [categories]);
  const productsForBrand = useMemo(() => {
    const brandProducts =
      brandFilter === "all"
        ? products
        : products.filter((product) => product.brand === brandFilter);

    return [...brandProducts].sort((a, b) =>
      compareProductPickerItems(a, b, categorySortOrder)
    );
  }, [brandFilter, categorySortOrder, products]);
  const productCategoryOptions = useMemo(() => {
    const options = new Map<
      string,
      { id: string; label: string; count: number; sortOrder: number }
    >();

    for (const product of productsForBrand) {
      const current = options.get(product.category_id) ?? {
        id: product.category_id,
        label: getProductCategoryLabel(product),
        count: 0,
        sortOrder: categorySortOrder.get(product.category_id) ?? Number.MAX_SAFE_INTEGER
      };

      current.count += 1;
      options.set(product.category_id, current);
    }

    return [...options.values()].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return brandCollator.compare(a.label, b.label);
    });
  }, [categorySortOrder, productsForBrand]);
  const productsForCategory = useMemo(() => {
    if (productCategoryFilter === "all") {
      return productsForBrand;
    }

    return productsForBrand.filter(
      (product) => product.category_id === productCategoryFilter
    );
  }, [productCategoryFilter, productsForBrand]);
  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return productsForCategory.slice(0, 12);
    }

    return productsForCategory.filter((product) => matchesProductQuery(product, query));
  }, [productsForCategory, query]);
  const categoryProductGroups = useMemo(() => {
    const groups = new Map<
      string,
      { id: string; label: string; sortOrder: number; products: GearProduct[] }
    >();

    for (const product of filteredProducts) {
      const current = groups.get(product.category_id) ?? {
        id: product.category_id,
        label: getProductCategoryLabel(product),
        sortOrder: categorySortOrder.get(product.category_id) ?? Number.MAX_SAFE_INTEGER,
        products: []
      };

      current.products.push(product);
      groups.set(product.category_id, current);
    }

    return [...groups.values()].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }

      return brandCollator.compare(a.label, b.label);
    });
  }, [categorySortOrder, filteredProducts]);
  const savingsJpy = calculateSavingsJpy(
    parsePositiveNumber(msrpJpy),
    parsePositiveNumber(purchasePriceJpy)
  );
  const selectedProduct = products.find((product) => product.id === productId) ?? null;

  function handleProductQuery(value: string) {
    setQuery(value);
    setName(value);
    setProductId("");
  }

  function handleBrandFilter(value: string) {
    setBrandFilter(value);
    setProductCategoryFilter("all");
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

      <section className="overflow-hidden rounded-lg border border-white/70 bg-white/90 shadow-soft">
        <div className="border-b border-stone-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-forest-700">
            <Sparkles className="h-4 w-4" />
            <span>公式カタログから選択</span>
          </div>
          <label className="mt-3 flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-stone-400" />
            <input
              name="name"
              required
              value={query}
              onChange={(event) => handleProductQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-base outline-none"
              placeholder="製品名・ブランド・型番で検索"
              autoComplete="off"
            />
          </label>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-700"
            >
              <Barcode className="h-4 w-4 text-forest-700" />
              バーコード
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-700"
            >
              <Camera className="h-4 w-4 text-forest-700" />
              カメラ
            </button>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold text-stone-500">ブランド</p>
          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            <ProductFilterChip
              active={brandFilter === "all"}
              onClick={() => handleBrandFilter("all")}
            >
              すべて
            </ProductFilterChip>
            {brandOptions.map((item) => (
              <ProductFilterChip
                key={item}
                active={brandFilter === item}
                onClick={() => handleBrandFilter(item)}
              >
                {item}
              </ProductFilterChip>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-stone-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-stone-500">
                  {brandFilter === "all" ? "カテゴリー" : `${brandFilter} のカテゴリー`}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  ブランドを選ぶと、その中のカテゴリーだけを表示します
                </p>
              </div>
              <span className="shrink-0 rounded bg-white px-2 py-1 text-xs font-semibold text-stone-500">
                {productsForBrand.length}件
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <ProductFilterChip
                active={productCategoryFilter === "all"}
                onClick={() => setProductCategoryFilter("all")}
              >
                すべて
              </ProductFilterChip>
              {productCategoryOptions.map((item) => (
                <ProductFilterChip
                  key={item.id}
                  active={productCategoryFilter === item.id}
                  onClick={() => setProductCategoryFilter(item.id)}
                >
                  {item.label}
                  <span className="ml-1 text-[11px] opacity-70">{item.count}</span>
                </ProductFilterChip>
              ))}
            </div>
          </div>

          {selectedProduct ? (
            <SelectedProductPreview product={selectedProduct} />
          ) : null}

          {categoryProductGroups.length > 0 ? (
            <div className="mt-4 grid gap-4">
              {categoryProductGroups.map((group) => (
                <div key={group.id}>
                  <div className="flex items-center justify-between px-1 text-xs font-semibold text-stone-500">
                    <span>{group.label}</span>
                    <span>{group.products.length}件</span>
                  </div>
                  <div className="mt-2 grid gap-2">
                    {group.products.map((product) => (
                      <ProductResultCard
                        key={product.id}
                        product={product}
                        selected={product.id === productId}
                        onSelect={() => applyProduct(product)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-500">
              該当する製品はありません
            </p>
          )}
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

function ProductFilterChip({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-forest-700 bg-forest-700 text-white"
          : "border-stone-200 bg-white text-stone-700 hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800"
      }`}
    >
      {children}
    </button>
  );
}

function ProductResultCard({
  product,
  selected,
  onSelect
}: {
  product: GearProduct;
  selected: boolean;
  onSelect: () => void;
}) {
  const displayName = product.name_ja ?? product.model;
  const weight = product.official_weight_grams ?? product.weight_grams;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
        selected
          ? "border-forest-700 bg-forest-50"
          : "border-stone-200 bg-white hover:border-forest-300 hover:bg-forest-50/60"
      }`}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-stone-50 p-1.5">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={displayName}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <PackagePlus className="h-6 w-6 text-stone-300" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold text-ink">
          {displayName}
        </span>
        <span className="mt-0.5 block truncate text-sm text-stone-500">
          {[product.brand, product.model].filter(Boolean).join(" / ")}
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded bg-forest-50 px-2 py-1 font-semibold text-forest-800">
            {getProductCategoryLabel(product)}
          </span>
          <span className="font-semibold text-stone-600">
            {formatWeightGrams(weight)}
          </span>
          <span className="text-stone-400">
            {product.msrp_jpy ? formatJpy(product.msrp_jpy) : "-"}
          </span>
        </span>
      </span>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
          selected
            ? "border-forest-700 bg-forest-700 text-white"
            : "border-stone-200 bg-white text-forest-700"
        }`}
      >
        {selected ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </span>
    </button>
  );
}

function SelectedProductPreview({ product }: { product: GearProduct }) {
  return (
    <div className="mt-4 grid grid-cols-[3.75rem_minmax(0,1fr)] gap-3 rounded-lg border border-forest-100 bg-forest-50 p-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white p-1.5">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name_ja ?? product.model}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <PackagePlus className="h-5 w-5 text-forest-700" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-forest-700">選択中</p>
        <p className="mt-1 truncate text-sm font-semibold text-ink">
          {product.name_ja ?? product.model}
        </p>
        <p className="mt-0.5 truncate text-xs text-stone-500">
          {[product.brand, getProductCategoryLabel(product), formatWeightGrams(product.official_weight_grams ?? product.weight_grams)]
            .filter(Boolean)
            .join(" / ")}
        </p>
      </div>
    </div>
  );
}

function getProductSearchValues(product: GearProduct) {
  return [
    product.name_ja,
    product.model,
    product.brand,
    product.gear_subcategories?.name_ja,
    product.gear_subcategories?.name_en,
    product.gear_subcategories?.name_en
      ? gearSubcategoryLabels[product.gear_subcategories.name_en]
      : null,
    ...getBrandSearchAliases(product.brand),
    ...getProductFamilySearchAliases(product),
    product.capacity,
    `${product.brand} ${product.model}`,
    ...(product.gear_product_aliases?.map((item) => item.alias) ?? [])
  ].filter((value): value is string => Boolean(value));
}

function getProductCategoryLabel(product: GearProduct) {
  return product.gear_categories?.name_ja ?? "その他";
}

function compareProductPickerItems(
  a: GearProduct,
  b: GearProduct,
  categorySortOrder: Map<string, number>
) {
  const categoryA = categorySortOrder.get(a.category_id) ?? Number.MAX_SAFE_INTEGER;
  const categoryB = categorySortOrder.get(b.category_id) ?? Number.MAX_SAFE_INTEGER;

  if (categoryA !== categoryB) {
    return categoryA - categoryB;
  }

  const categoryLabel = brandCollator.compare(
    getProductCategoryLabel(a),
    getProductCategoryLabel(b)
  );

  if (categoryLabel !== 0) {
    return categoryLabel;
  }

  return brandCollator.compare(a.model, b.model);
}

const brandPriority = [
  "mont-bell",
  "THE NORTH FACE",
  "Black Diamond",
  "NANGA",
  "ISUKA",
  "NEMO",
  "Therm-a-Rest",
  "SOTO"
];
const brandCollator = new Intl.Collator("ja");

function compareProductBrands(a: string, b: string) {
  const priorityA = brandPriority.findIndex((brand) => normalize(brand) === normalize(a));
  const priorityB = brandPriority.findIndex((brand) => normalize(brand) === normalize(b));

  if (priorityA !== -1 || priorityB !== -1) {
    return (priorityA === -1 ? Number.MAX_SAFE_INTEGER : priorityA)
      - (priorityB === -1 ? Number.MAX_SAFE_INTEGER : priorityB);
  }

  return brandCollator.compare(a, b);
}

function getBrandSearchAliases(brand: string) {
  if (normalize(brand) === "thenorthface") {
    return [
      "THE NORTH FACE",
      "The North Face",
      "North Face",
      "northface",
      "ザ・ノース・フェイス",
      "ザノースフェイス",
      "ノースフェイス",
      "北面",
      "TNF"
    ];
  }

  if (normalize(brand) === "mont-bell" || normalize(brand) === "montbell") {
    return ["montbell", "モンベル"];
  }

  if (normalize(brand) === "blackdiamond") {
    return [
      "BlackDiamond",
      "Black Diamond",
      "ブラックダイヤモンド",
      "ブラック ダイヤモンド",
      "BD"
    ];
  }

  if (normalize(brand) === "nanga") {
    return ["NANGA", "Nanga", "ナンガ"];
  }

  if (normalize(brand) === "isuka") {
    return ["ISUKA", "Isuka", "イスカ"];
  }

  if (normalize(brand) === "nemo") {
    return [
      "NEMO",
      "Nemo",
      "NEMO Equipment",
      "ニーモ",
      "ニーモイクイップメント"
    ];
  }

  if (normalize(brand) === "thermarest") {
    return [
      "Therm-a-Rest",
      "Thermarest",
      "Therm A Rest",
      "サーマレスト"
    ];
  }

  return [];
}

function getProductFamilySearchAliases(product: GearProduct) {
  const text = `${product.name_ja ?? ""} ${product.model ?? ""}`;
  const normalizedText = normalize(text);
  const aliases: string[] = [];
  const add = (...items: string[]) => aliases.push(...items);

  if (normalizedText.includes("テルス")) {
    add("Tellus", "TELLUS", "テルス");
  }

  if (normalizedText.includes("サム")) {
    add("Saum", "SAUM", "サム");
  }

  if (normalizedText.includes("サミットamk")) {
    add("Summit AMK", "SUMMIT AMK", "AMK", "サミット AMK");
  }

  if (normalizedText.includes("アークティック")) {
    add("Arctic", "ARCTIC", "アークティック");
  }

  if (normalizedText.includes("マウンテンショット")) {
    add("Mountain Shot", "MountainShot", "MOUNTAIN SHOT", "マウンテンショット");
  }

  if (normalizedText.includes("マウンテングローリー")) {
    add("Mountain Glory", "MountainGlory", "MOUNTAIN GLORY", "マウンテングローリー");
  }

  if (normalizedText.includes("フットプリント")) {
    add("Footprint", "footprint", "Groundsheet", "Ground Sheet", "グラウンドシート");
  }

  if (normalizedText.includes("クライムライト")) {
    add("Climb Light", "ClimbLight", "クライムライト");
  }

  if (normalizedText.includes("フューチャーライト")) {
    add("Futurelight", "Future Light", "FUTURELIGHT", "フューチャーライト");
  }

  if (normalizedText.includes("ストライクトレイル")) {
    add("Strike Trail", "StrikeTrail", "ストライクトレイル");
  }

  if (normalizedText.includes("サンダー")) {
    add("Thunder", "サンダー");
  }

  if (normalizedText.includes("デナリ")) {
    add("Denali", "デナリ");
  }

  if (normalizedText.includes("アルパインライト")) {
    add("Alpine Light", "AlpineLight", "アルパインライト");
  }

  if (normalizedText.includes("クレストン")) {
    add("Creston", "クレストン");
  }

  if (normalizedText.includes("ベクティブ")) {
    add("Vectiv", "VECTIV", "ベクティブ");
  }

  if (normalizedText.includes("ディスタンス")) {
    add("Distance", "DISTANCE", "ディスタンス");
  }

  if (normalizedText.includes("スポット")) {
    add("Spot", "SPOT", "スポット");
  }

  if (normalizedText.includes("ストーム")) {
    add("Storm", "STORM", "ストーム");
  }

  if (normalizedText.includes("アストロ")) {
    add("Astro", "ASTRO", "アストロ");
  }

  if (normalizedText.includes("コズモ")) {
    add("Cosmo", "COSMO", "Cosmo 350", "Cosmo350", "コズモ");
  }

  if (normalizedText.includes("ディプロイ")) {
    add("Deploy", "DEPLOY", "ディプロイ");
  }

  if (normalizedText.includes("トレイルビスタ")) {
    add("Trail Vista", "TrailVista", "トレイル ビスタ");
  }

  if (normalizedText.includes("パーシュート")) {
    add("Pursuit", "Pursuit Carbon", "パーシュート");
  }

  if (normalizedText.includes("トレイルバック")) {
    add("Trail Back", "Trailback", "トレイル バック");
  }

  if (normalizedText === normalize("トレイル")) {
    add("Black Diamond Trail", "Trail");
  }

  if (normalizedText.includes("ベイパー")) {
    add("Vapor", "ベイパー");
  }

  if (normalizedText.includes("ビジョン")) {
    add("Vision", "VISION", "ビジョン");
  }

  if (normalizedText.includes("キャピタン")) {
    add("Capitan", "Capitan E", "キャピタン");
  }

  if (normalizedText.includes("ハーフドーム")) {
    add("Half Dome", "HalfDome", "ハーフ ドーム");
  }

  if (normalizedText.includes("レイブン")) {
    add("Raven", "Raven Pro", "ピッケル");
  }

  if (normalizedText.includes("ベノム")) {
    add("Venom", "Venom LT", "ピッケル");
  }

  if (normalizedText.includes("コンタクト")) {
    add("Contact", "Contact Strap", "アイゼン", "Crampon", "Crampons");
  }

  if (normalizedText.includes("セラック")) {
    add("Serac", "アイゼン", "Crampon", "Crampons");
  }

  if (normalizedText.includes("セイバートゥース")) {
    add("Sabretooth", "Sabretooth Pro", "アイゼン", "Crampon", "Crampons");
  }

  if (normalizedText.includes("サイボーグ")) {
    add("Cyborg", "Cyborg Pro", "アイゼン", "Crampon", "Crampons");
  }

  if (normalizedText.includes("ネーベ")) {
    add("Neve", "アイゼン", "Crampon", "Crampons");
  }

  if (normalizedText.includes("スクリーンタップ")) {
    add("Screentap", "Screen Tap", "ライナー", "Liner");
  }

  if (normalizedText.includes("ソロイスト")) {
    add("Soloist", "Soloist Gloves", "ソロイスト");
  }

  if (normalizedText.includes("ガイドグローブ")) {
    add("Guide Gloves", "Guide Glove", "ガイド グローブ");
  }

  if (normalizedText.includes("ミッション")) {
    add("Mission", "Mission 55", "ミッション");
  }

  if (normalizedText.includes("スピード")) {
    add("Speed", "SPEED", "スピード");
  }

  if (normalizedText.includes("ブリッツ")) {
    add("Blitz", "BLITZ", "ブリッツ");
  }

  if (normalizedText.includes("オーロラテックス")) {
    add("Aurora", "AURORA", "AURORA TEX", "Aurora Tex", "Aurora Light");
  }

  if (normalizedText.includes("udd")) {
    add("UDD BAG", "UDD Bag", "UDDバッグ");
  }

  if (normalizedText.includes("ミニマリスム")) {
    add("MINIMARHYTHM", "Minimarhythm", "Minimalism");
  }

  if (normalizedText.includes("レベル8")) {
    add("LEVEL8", "Level 8", "Level8");
  }

  if (normalizedText.includes("エアドライト")) {
    add("Air Dryght", "AirDryght", "エア ドライト");
  }

  if (normalizedText.includes("エアプラス")) {
    add("Air Plus", "AirPlus", "エア プラス");
  }

  if (normalizedText.includes("アルファライト")) {
    add("Alpha Light", "AlphaLight", "ALPHA LIGHT");
  }

  if (normalizedText.includes("ダウンプラス")) {
    add("Down Plus", "DownPlus", "DOWN PLUS");
  }

  if (normalizedText.includes("シュラフカバー")) {
    add("Sleeping Bag Cover", "Sleepingbag Cover", "シュラフ カバー");
  }

  if (normalizedText.includes("テンサー")) {
    add("Tensor", "TENSOR", "テンサー");
  }

  if (normalizedText.includes("フィッロ")) {
    add("Fillo", "FILLO", "ピロー", "Pillow", "枕", "まくら");
  }

  if (normalizedText.includes("ドラゴンフライ")) {
    add("Dragonfly", "Dragonfly OSMO", "ドラゴンフライ オズモ");
  }

  if (normalizedText.includes("ホーネット")) {
    add("Hornet", "Hornet OSMO", "ホーネット オズモ");
  }

  if (normalizedText.includes("タニ")) {
    add("Tani", "Tani OSMO", "タニ オズモ");
  }

  if (normalizedText.includes("neoair")) {
    add("NeoAir", "ネオエアー", "ネオエア");
  }

  if (normalizedText.includes("xlite")) {
    add("XLite", "X Lite", "エックスライト");
  }

  if (normalizedText.includes("xtherm")) {
    add("XTherm", "X Therm", "エックスサーム");
  }

  if (normalizedText.includes("zlite")) {
    add("Z Lite", "ZLite", "Zライト");
  }

  if (normalizedText.includes("prolite")) {
    add("ProLite", "Pro Lite", "プロライト");
  }

  if (normalizedText.includes("ridgerest")) {
    add("RidgeRest", "Ridge Rest", "リッジレスト");
  }

  return aliases;
}

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/^ザ[・･]?/, "")
    .replace(/['’"“”`]/g, "")
    .replace(/[\s()\[\]{}（）【】「」『』・･/／\\_.。,，:：;；#＃+-]+/g, "");
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
