"use client";

import {
  Check,
  ChevronRight,
  ImagePlus,
  Loader2,
  PackagePlus,
  Pencil,
  Search,
  Sparkles
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { captureAnalyticsEvent } from "@/lib/analytics";
import {
  getProductDisplayTitle,
  getProductVolume,
  isBackpackProduct,
  normalizeGearText
} from "@/lib/gear-display";
import {
  gearSubcategoryLabels,
  statusLabels,
  weightTypeLabels
} from "@/lib/i18n/labels";
import { buildGearHref } from "@/lib/plan-return-to";
import { createClient } from "@/lib/supabase/client";
import type {
  GearActionResult,
  GearCategory,
  GearProduct,
  GearSubcategory,
  UserGear
} from "@/lib/types";
import { formatJpy } from "@/lib/utils/format";

type GearFormProps = {
  categories: GearCategory[];
  subcategories: GearSubcategory[];
  products: GearProduct[];
  action: (formData: FormData) => Promise<GearActionResult>;
  gear?: UserGear;
  error?: string;
  returnTo?: string | null;
};

export function GearForm({
  categories,
  subcategories,
  products,
  action,
  gear,
  error,
  returnTo
}: GearFormProps) {
  const initialCategoryId = gear?.category_id ?? "";
  const initialSubcategoryId = gear?.subcategory_id ?? "";
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [subcategoryId, setSubcategoryId] = useState(initialSubcategoryId);
  const [productId, setProductId] = useState(gear?.product_id ?? "");
  const [query, setQuery] = useState(gear?.name ?? "");
  const [brandFilter, setBrandFilter] = useState("all");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productListExpanded, setProductListExpanded] = useState(false);
  const [name, setName] = useState(gear?.name ?? "");
  const [brand, setBrand] = useState(gear?.brand ?? "");
  const [model, setModel] = useState(gear?.model ?? "");
  const [officialWeightGrams, setOfficialWeightGrams] = useState(
    String(gear?.official_weight_grams ?? gear?.weight_grams ?? "")
  );
  const [msrpJpy, setMsrpJpy] = useState(String(gear?.msrp_jpy ?? ""));
  const [status, setStatus] = useState(gear?.status ?? "owned");
  const [size, setSize] = useState(gear?.size ?? "");
  const [volume, setVolume] = useState(gear?.volume ?? "");
  const [color, setColor] = useState(gear?.color ?? "");
  const [material, setMaterial] = useState(gear?.material ?? "");
  const [capacity, setCapacity] = useState(gear?.capacity ?? "");
  const [officialUrl, setOfficialUrl] = useState(gear?.official_url ?? "");
  const [imageUrl, setImageUrl] = useState(gear?.image_url ?? "");
  const [imageStoragePath, setImageStoragePath] = useState(
    gear?.image_storage_path ?? ""
  );
  const [localImagePreviewUrl, setLocalImagePreviewUrl] = useState("");
  const [manualMode, setManualMode] = useState(Boolean(gear));
  const [imageUploadStatus, setImageUploadStatus] = useState<
    "idle" | "uploading" | "error"
  >("idle");
  const [imageUploadError, setImageUploadError] = useState("");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "pending" | "success"
  >("idle");
  const [submitError, setSubmitError] = useState(error ?? "");
  const manualEntryRef = useRef<HTMLElement>(null);
  const router = useRouter();

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
    return getProductBrandOptions(products);
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
  const hasProductQuery = Boolean(normalize(query));
  const filteredProducts = useMemo(() => {
    if (!hasProductQuery) {
      return productListExpanded ? productsForCategory : productsForCategory.slice(0, 12);
    }

    return productsForCategory.filter((product) => matchesProductQuery(product, query));
  }, [hasProductQuery, productListExpanded, productsForCategory, query]);
  const hiddenProductCount = Math.max(0, productsForCategory.length - filteredProducts.length);
  const productSuggestions = useMemo(() => {
    const normalizedQuery = normalize(query);

    if (!normalizedQuery) {
      return productsForCategory.slice(0, 6);
    }

    return productsForCategory
      .filter((product) => matchesProductQuery(product, query))
      .slice(0, 6);
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
  const selectedProduct = products.find((product) => product.id === productId) ?? null;
  const isEditing = Boolean(gear);
  const shouldShowGearDetails = manualMode || Boolean(selectedProduct);
  const shouldShowBottomActions = manualMode || isEditing;

  function handleProductQuery(value: string) {
    setQuery(value);
    setName(value);
    setProductId("");
    setProductListExpanded(false);
  }

  function handleProductCategoryFilter(value: string) {
    setProductCategoryFilter(value);
    setProductListExpanded(false);
    // 同上:切品类时如果之前锁定了某个具体商品的搜索词,也要清空。
    if (productId) {
      setProductId("");
      setQuery("");
    }
  }

  function confirmProductSearch() {
    const exactMatch = productSuggestions.find(
      (product) => normalize(getProductDisplayTitle(product)) === normalize(query)
    );
    const nextProduct = exactMatch ?? (productSuggestions.length === 1 ? productSuggestions[0] : null);

    if (nextProduct) {
      applyProduct(nextProduct);
    }
  }

  function handleBrandFilter(value: string) {
    setBrandFilter(value);
    setProductCategoryFilter("all");
    setProductListExpanded(false);
    // 之前选中过具体商品(如 Mont-bell 的某个包)后,query 会被锁定成
    // 那个商品的准确名称;此时再切品牌/品类,列表还是按那个名字过滤,
    // 导致"看起来只显示最初点的那一个"。这里切品牌时清空已选商品和搜索词,
    // 让列表重新按新品牌正常显示。
    if (productId) {
      setProductId("");
      setQuery("");
    }
  }

  function startManualEntry() {
    setManualMode(true);
    setProductId("");
    setName((current) => current || query);
    if (!gear) {
      setImageUrl("");
      setImageStoragePath("");
      setLocalImagePreviewUrl("");
    }
    window.requestAnimationFrame(() => {
      manualEntryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  function applyProduct(product: GearProduct) {
    const productName = product.name_ja ?? product.model;
    const productVolume = getProductVolume(product);
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
    setMsrpJpy(String(product.msrp_jpy ?? ""));
    setStatus("owned");
    setSize(product.size ?? "");
    setVolume(productVolume ?? "");
    setColor(product.color ?? "");
    setMaterial(product.material ?? "");
    setCapacity(isBackpackProduct(product) ? "" : product.capacity ?? "");
    setOfficialUrl(product.official_url ?? "");
    setImageUrl(product.image_url ?? "");
    setImageStoragePath("");
    setLocalImagePreviewUrl("");
  }

  async function handleImageFile(file: File | null) {
    if (!file) {
      return;
    }

    setImageUploadStatus("uploading");
    setImageUploadError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("ログイン状態を確認できませんでした");
      }

      const extension = getImageExtension(file);
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("gear-images")
        .upload(path, file, {
          cacheControl: "31536000",
          contentType: file.type || "image/jpeg",
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      setImageUrl("");
      setImageStoragePath(path);
      setLocalImagePreviewUrl(URL.createObjectURL(file));
      setImageUploadStatus("idle");
    } catch (error) {
      setImageUploadStatus("error");
      setImageUploadError(
        error instanceof Error ? error.message : "画像をアップロードできませんでした"
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // 双击/重复提交保护
    if (submitStatus !== "idle") {
      return;
    }

    setSubmitStatus("pending");
    setSubmitError("");

    const formData = new FormData(event.currentTarget);

    try {
      const result = await action(formData);

      if (result.ok) {
        if (status === "owned") {
          captureAnalyticsEvent("gear_mark_owned", {
            source: "gear_form",
            category: categoryId,
            is_catalog_item: Boolean(productId)
          });
        }

        // 先立刻显示"保存しました",不等目标页整个渲染完再消失
        setSubmitStatus("success");

        if (returnTo && result.redirectTo === returnTo) {
          window.location.assign(returnTo);
          return;
        }

        router.push(result.redirectTo as Route);
      } else {
        setSubmitStatus("idle");
        setSubmitError(result.error);
      }
    } catch (submitException) {
      setSubmitStatus("idle");
      setSubmitError(
        submitException instanceof Error
          ? submitException.message
          : "保存できませんでした"
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}

      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="image_storage_path" value={imageStoragePath} />
      <input type="hidden" name="brand" value={brand} />
      <input type="hidden" name="model" value={model} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="subcategory_id" value={subcategoryId} />
      <input type="hidden" name="official_weight_grams" value={officialWeightGrams} />
      <input type="hidden" name="returnTo" value={returnTo ?? ""} />

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-stone-100 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-forest-700">
            <Sparkles className="h-4 w-4" />
            <span>公式カタログから選択</span>
          </div>
          <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-3">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 shrink-0 text-stone-400" />
              <input
                value={query}
                onChange={(event) => handleProductQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-base outline-none"
                placeholder="製品名・ブランド・型番で検索"
                autoComplete="off"
                list="gear-product-suggestions"
              />
              <button
                type="button"
                onClick={confirmProductSearch}
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-ink px-3 text-sm font-semibold leading-none text-white transition active:scale-95"
              >
                検索
              </button>
            </div>
            <datalist id="gear-product-suggestions">
              {productSuggestions.map((product) => (
                <option key={product.id} value={getProductDisplayTitle(product)} />
              ))}
            </datalist>
            {query ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {productSuggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => applyProduct(product)}
                    className="shrink-0 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-xs font-semibold text-stone-700"
                  >
                    <span className="block max-w-44 truncate">
                      {getProductDisplayTitle(product)}
                    </span>
                    <span className="mt-0.5 block max-w-44 truncate font-medium text-stone-400">
                      {product.brand}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={startManualEntry}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-forest-100 bg-forest-50 px-3 py-3 text-left text-sm font-semibold text-forest-800 transition active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-forest-700" />
                カタログにない装備を登録
              </span>
              <ChevronRight className="h-4 w-4 text-stone-400" />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <p className="text-xs font-semibold text-stone-500">ブランド</p>
          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            <ProductFilterChip
              active={brandFilter === "all"}
              onClick={() => handleBrandFilter("all")}
              fixedWidth
            >
              すべて
            </ProductFilterChip>
            {brandOptions.map((item) => (
              <ProductFilterChip
                key={item}
                active={brandFilter === item}
                onClick={() => handleBrandFilter(item)}
                ariaLabel={`${item}を選択`}
                fixedWidth
                logoSurface
              >
                <BrandLogo brand={item} compact />
              </ProductFilterChip>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-[#F7F8F5] p-3">
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
                onClick={() => handleProductCategoryFilter("all")}
              >
                すべて
              </ProductFilterChip>
              {productCategoryOptions.map((item) => (
                <ProductFilterChip
                  key={item.id}
                  active={productCategoryFilter === item.id}
                  onClick={() => handleProductCategoryFilter(item.id)}
                >
                  {item.label}
                  <span className="ml-1 text-[11px] opacity-70">{item.count}</span>
                </ProductFilterChip>
              ))}
            </div>
          </div>

          {selectedProduct && !manualMode ? (
            <SelectedProductConfirmCard
              product={selectedProduct}
              submitStatus={submitStatus}
            />
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
              {!hasProductQuery && hiddenProductCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setProductListExpanded(true)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-forest-700 shadow-sm transition hover:border-forest-200 hover:bg-forest-50"
                >
                  もっと表示
                  <span className="ml-2 text-xs font-medium text-stone-500">
                    残り {hiddenProductCount} 件
                  </span>
                </button>
              ) : null}
              {!hasProductQuery && productListExpanded && productsForCategory.length > 12 ? (
                <button
                  type="button"
                  onClick={() => setProductListExpanded(false)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-600 shadow-sm transition hover:bg-stone-50"
                >
                  表示を少なくする
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-500">
              該当する製品はありません
            </p>
          )}
        </div>
      </section>

      {manualMode ? (
        <section ref={manualEntryRef} className="scroll-mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-xs font-semibold text-forest-700">手入力</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">自分の装備情報</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-stone-700">製品名</span>
                <input
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setQuery(event.target.value);
                  }}
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                  placeholder="例：Mountain Shot 2"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-stone-700">ブランド</span>
                <input
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                  placeholder="例：finetrack"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-stone-700">モデル</span>
                <input
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                  placeholder="例：MINI2"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-stone-700">カテゴリー</span>
                <select
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

              <label className="block">
                <span className="text-sm font-medium text-stone-700">公式重量（g）</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={officialWeightGrams}
                  onChange={(event) => setOfficialWeightGrams(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                  placeholder="例：398"
                />
              </label>
            </div>

            <div>
              <p className="text-sm font-medium text-stone-700">装備写真</p>
              <label className="mt-2 flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 text-center transition hover:border-forest-400 hover:bg-forest-50">
                {localImagePreviewUrl || imageUrl ? (
                  <img
                    src={localImagePreviewUrl || imageUrl}
                    alt={name || "装備写真"}
                    className="max-h-40 max-w-full object-contain"
                  />
                ) : (
                  <>
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-forest-700 shadow-sm">
                      <ImagePlus className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      写真を追加
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => void handleImageFile(event.target.files?.[0] ?? null)}
                />
              </label>
              {imageUploadStatus === "uploading" ? (
                <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-forest-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  画像をアップロード中
                </p>
              ) : null}
              {imageUploadStatus === "error" ? (
                <p className="mt-2 text-xs font-semibold text-red-700">
                  {imageUploadError}
                </p>
              ) : null}
              {localImagePreviewUrl || imageUrl || imageStoragePath ? (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setImageStoragePath("");
                    setLocalImagePreviewUrl("");
                  }}
                  className="mt-2 text-xs font-semibold text-stone-500"
                >
                  写真を削除
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {shouldShowGearDetails ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-ink">登録情報</h2>
          </div>

        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>

        <dl className="mt-4 grid gap-3 rounded-2xl bg-stone-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-stone-500">公式価格</dt>
            <dd className="mt-1 font-semibold text-ink">
              {Number(msrpJpy) > 0
                ? formatJpy(Number(msrpJpy))
                : "-"}
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
      ) : null}

      {shouldShowGearDetails ? (
        <details className="rounded-2xl bg-white p-5 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-forest-700">
            詳細設定
          </summary>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
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
      ) : null}

      {shouldShowBottomActions ? (
        <div className="flex flex-col gap-3 pb-4 sm:flex-row">
          <Link
            href={buildGearHref("/gear", returnTo)}
            className="flex-1 rounded-xl border border-stone-200 bg-white px-5 py-3 text-center text-base font-semibold text-stone-700"
          >
            キャンセル
          </Link>
          <GearSubmitButton
            status={submitStatus}
            className="flex-1 rounded-xl bg-forest-700 px-5 py-3 text-base font-semibold text-white disabled:opacity-60"
          >
            {isEditing ? "保存" : "この装備を登録"}
          </GearSubmitButton>
        </div>
      ) : null}
    </form>
  );
}

function GearSubmitButton({
  status,
  className,
  children
}: {
  status: "idle" | "pending" | "success";
  className?: string;
  children: ReactNode;
}) {
  return (
    <button type="submit" disabled={status !== "idle"} className={className}>
      <span className="inline-flex items-center justify-center gap-1.5">
        {status === "success" ? <Check className="h-4 w-4" /> : null}
        {status === "pending"
          ? "保存中..."
          : status === "success"
            ? "保存しました"
            : children}
      </span>
    </button>
  );
}

function ProductFilterChip({
  active,
  onClick,
  children,
  ariaLabel,
  fixedWidth = false,
  logoSurface = false
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  ariaLabel?: string;
  fixedWidth?: boolean;
  logoSurface?: boolean;
}) {
  const stateClass = logoSurface
    ? active
      ? "border-forest-700 bg-white text-stone-900 ring-1 ring-forest-700"
      : "border-stone-200 bg-white text-stone-700 hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800"
    : active
      ? "border-forest-700 bg-forest-700 text-white"
      : "border-stone-200 bg-white text-stone-700 hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex h-10 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold leading-none transition ${
        fixedWidth ? "w-[7.75rem] px-2" : "px-3"
      } ${stateClass}`}
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
  const displayName = getProductDisplayTitle(product);
  const weight = product.official_weight_grams ?? product.weight_grams;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-3 py-3 text-left shadow-sm transition ${
        selected
          ? "border-forest-700 bg-forest-50"
          : "border-stone-200 bg-white hover:border-forest-300 hover:bg-forest-50/60"
      }`}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-stone-50 p-2">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={displayName}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <ProductImageFallback brand={product.brand} compact />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base font-semibold text-ink">
          {displayName}
        </span>
        <span className="mt-0.5 block truncate text-sm text-stone-500">
          {[product.brand, product.model].filter(Boolean).join(" / ")}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="rounded-lg bg-forest-50 px-2 py-0.5 font-semibold text-forest-800">
            {getProductCategoryLabel(product)}
          </span>
          <span className="font-semibold text-stone-600">{formatWeightGrams(weight)}</span>
          <span className="text-stone-400">{formatProductPrice(product.msrp_jpy)}</span>
        </span>
      </span>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
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

function SelectedProductConfirmCard({
  product,
  submitStatus
}: {
  product: GearProduct;
  submitStatus: "idle" | "pending" | "success";
}) {
  const displayName = getProductDisplayTitle(product);
  const productVolume = getProductVolume(product);
  const productCapacity = isBackpackProduct(product) ? null : product.capacity;
  const weight = product.official_weight_grams ?? product.weight_grams;

  return (
    <div className="mt-4 rounded-2xl border border-forest-100 bg-forest-50 p-3">
      <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white p-2 shadow-sm">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={displayName}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          ) : (
            <ProductImageFallback brand={product.brand} />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-forest-700">登録内容を確認</p>
          <p className="mt-1 truncate text-base font-semibold text-ink">
            {displayName}
          </p>
          <p className="mt-0.5 truncate text-sm text-stone-500">
            {[product.brand, product.model].filter(Boolean).join(" / ")}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <ProductFact label="重量" value={formatWeightGrams(weight)} />
            <ProductFact label="価格" value={formatProductPrice(product.msrp_jpy)} />
            <ProductFact label="カテゴリー" value={getProductCategoryLabel(product)} />
            <ProductFact label="容量" value={productVolume ?? productCapacity ?? "-"} />
          </dl>
        </div>
      </div>
      <GearSubmitButton
        status={submitStatus}
        className="mt-3 w-full rounded-xl bg-forest-700 px-5 py-3 text-base font-semibold text-white disabled:opacity-60"
      >
        この装備を登録
      </GearSubmitButton>
    </div>
  );
}

function ProductFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/70 px-2 py-1.5">
      <dt className="text-[10px] font-semibold text-stone-400">{label}</dt>
      <dd className="mt-0.5 truncate font-semibold text-stone-700">{value}</dd>
    </div>
  );
}

function ProductImageFallback({
  brand,
  compact = false
}: {
  brand: string;
  compact?: boolean;
}) {
  return (
    <span className="flex h-full w-full flex-col items-center justify-center rounded-lg bg-white/70 text-center">
      <PackagePlus className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-stone-300`} />
      <span className="mt-1 line-clamp-2 px-1 text-[10px] font-semibold leading-tight text-stone-400">
        {brand}
      </span>
    </span>
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
    getProductDisplayTitle(product),
    product.volume,
    getProductVolume(product),
    isBackpackProduct(product) ? null : product.capacity,
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

function getProductBrandOptions(products: GearProduct[]) {
  const productCountByBrand = new Map<string, number>();

  for (const product of products) {
    if (!product.brand) {
      continue;
    }

    productCountByBrand.set(
      product.brand,
      (productCountByBrand.get(product.brand) ?? 0) + 1
    );
  }

  return [...productCountByBrand.entries()]
    .sort(([brandA, countA], [brandB, countB]) => {
      if (countA !== countB) {
        return countB - countA;
      }

      return brandCollator.compare(brandA, brandB);
    })
    .map(([brand]) => brand);
}

const brandCollator = new Intl.Collator("ja");

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

  if (normalize(brand) === "山と道") {
    return ["Yamatomichi", "Yama to Michi", "Yama-to-Michi", "山道", "ヤマトミチ"];
  }

  if (normalize(brand) === "finetrack") {
    return ["finetrack", "Fine Track", "ファイントラック"];
  }

  if (normalize(brand) === "caravan") {
    return ["Caravan", "キャラバン", "GRANDKING", "Grandking", "グランドキング"];
  }

  if (normalize(brand) === "columbia") {
    return ["Columbia", "コロンビア"];
  }

  if (normalize(brand) === "millet") {
    return ["MILLET", "Millet", "ミレー"];
  }

  if (normalize(brand) === "arcteryx") {
    return ["Arc'teryx", "Arcteryx", "ArcTeryx", "アークテリクス"];
  }

  if (normalize(brand) === "patagonia") {
    return ["patagonia", "Patagonia", "パタゴニア"];
  }

  if (normalize(brand) === "gregory") {
    return ["GREGORY", "Gregory", "グレゴリー"];
  }

  if (normalize(brand) === "lasportiva") {
    return ["LA SPORTIVA", "La Sportiva", "スポルティバ", "ラスポルティバ"];
  }

  if (normalize(brand) === "mammut") {
    return ["Mammut", "MAMMUT", "マムート"];
  }

  if (normalize(brand) === "osprey") {
    return ["Osprey", "OSPREY", "Osprey Packs", "オスプレー"];
  }

  if (normalize(brand) === "petzl") {
    return ["Petzl", "PETZL", "ペツル"];
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

  if (normalize(brand) === "soto") {
    return ["SOTO", "新富士バーナー", "ソト"];
  }

  if (normalize(brand) === "evernew") {
    return ["EVERNEW", "Evernew", "エバニュー"];
  }

  if (normalize(brand) === "アライテント") {
    return ["Arai Tent", "ARAITENT", "Arai", "アライ", "ライペン", "RIPEN"];
  }

  if (normalize(brand) === "msr") {
    return ["MSR", "Mountain Safety Research", "エムエスアール"];
  }

  if (normalize(brand) === "garmin") {
    return ["Garmin", "GARMIN", "ガーミン"];
  }

  if (normalize(brand) === "salomon") {
    return ["Salomon", "SALOMON", "サロモン"];
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

  if (normalizedText.includes("mini2")) {
    add("Yamatomichi MINI2", "山と道 MINI2", "山道 MINI2");
  }

  if (normalizedText.includes("mini")) {
    add("Yamatomichi MINI", "山と道 MINI", "山道 MINI");
  }

  if (normalizedText.includes("three")) {
    add("Yamatomichi THREE", "山と道 THREE", "山道 THREE");
  }

  if (normalizedText.includes("one")) {
    add("Yamatomichi ONE", "山と道 ONE", "山道 ONE");
  }

  if (normalizedText.includes("sacoche")) {
    add("サコッシュ", "Yamatomichi Sacoche", "山と道 サコッシュ");
  }

  if (normalizedText.includes("stuffpack")) {
    add("Stuff Pack", "スタッフパック");
  }

  if (normalizedText.includes("zippack")) {
    add("Zip Pack", "ジップパック");
  }

  if (normalizedText.includes("packliner")) {
    add("Pack Liner", "パックライナー");
  }

  if (normalizedText.includes("ulshirt")) {
    add("UL Shirt", "ULシャツ");
  }

  if (normalizedText.includes("allweather")) {
    add("All-weather", "All Weather", "オールウェザー", "レインウェア");
  }

  if (normalizedText.includes("lightalpha")) {
    add("Light Alpha", "ライトアルファ", "Alpha Direct", "アルファダイレクト");
  }

  if (normalizedText.includes("カミナドーム")) {
    add("Kamina Dome", "KAMINA DOME", "カミナ ドーム");
  }

  if (normalizedText.includes("カミナモノポール")) {
    add("Kamina Monopole", "KAMINA MONOPOLE", "カミナ モノポール");
  }

  if (normalizedText.includes("ピコシェルター")) {
    add("Pico Shelter", "Picoshelter", "ビバーク", "ツエルト");
  }

  if (normalizedText.includes("ツエルト")) {
    add("Zelt", "ツェルト", "ビバーク");
  }

  if (normalizedText.includes("ゴージュタープ")) {
    add("Gorge Tarp", "GorgeTarp", "タープ");
  }

  if (normalizedText.includes("c102s")) {
    add("C1_02S", "C1-02S", "C102S", "キャラバン C1");
  }

  if (normalizedText.includes("c403")) {
    add("C4_03", "C4-03", "C403", "キャラバン C4");
  }

  if (normalizedText.includes("gk85")) {
    add("GK85", "GRANDKING GK85", "グランドキング GK85");
  }

  if (normalizedText.includes("gk8x")) {
    add("GK8X", "GK8X FFF", "GRANDKING GK8X", "グランドキング GK8X");
  }

  if (normalizedText.includes("gkalthi")) {
    add("GK ALT HI", "GK_ALT HI", "GRANDKING ALT", "グランドキング ALT");
  }

  if (normalizedText.includes("ケストレル")) {
    add("Kestrel", "オスプレー ケストレル");
  }

  if (normalizedText.includes("エクソス")) {
    add("Exos", "Exos Pro", "オスプレー エクソス");
  }

  if (normalizedText.includes("タロン")) {
    add("Talon", "Talon Pro", "Talon Velocity", "オスプレー タロン");
  }

  if (normalizedText.includes("テンペスト")) {
    add("Tempest", "Tempest Velocity", "オスプレー テンペスト");
  }

  if (normalizedText.includes("actik")) {
    add("ACTIK", "Actik", "アクティック");
  }

  if (normalizedText.includes("tikka")) {
    add("TIKKA", "Tikka", "ティカ");
  }

  if (normalizedText.includes("swiftrl")) {
    add("SWIFT RL", "Swift RL", "スイフト RL");
  }

  if (normalizedText.includes("ikocore")) {
    add("IKO CORE", "Iko Core", "イコ コア");
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

  if (normalizedText.includes("etrex")) {
    add("eTrex", "eTrex SE", "イートレックス", "ガーミン GPS");
  }

  if (normalizedText.includes("ti570")) {
    add("Ti 570FD", "Ti 570FD Cup", "EBY274", "エバニュー チタンカップ");
  }

  return aliases;
}

function normalize(value: string) {
  return normalizeGearText(value);
}

function formatWeightGrams(value: number | null | undefined) {
  return typeof value === "number" ? `${value}g` : "公式確認中";
}

function formatProductPrice(value: number | null | undefined) {
  return typeof value === "number" ? formatJpy(value) : "公式確認中";
}

function getImageExtension(file: File) {
  const extensionFromName = file.name.split(".").pop()?.toLowerCase();

  if (extensionFromName && /^[a-z0-9]+$/.test(extensionFromName)) {
    return extensionFromName === "jpeg" ? "jpg" : extensionFromName;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  if (file.type === "image/gif") {
    return "gif";
  }

  if (file.type === "image/heic") {
    return "heic";
  }

  if (file.type === "image/heif") {
    return "heif";
  }

  return "jpg";
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
