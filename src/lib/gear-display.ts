import type { GearProduct, UserGear } from "@/lib/types";
import { formatWeight } from "@/lib/utils/format";

export function getGearDisplayWeightGrams(item: UserGear) {
  const official = item.official_weight_grams;

  if (typeof official === "number") {
    return official;
  }

  return item.weight_grams > 0 ? item.weight_grams : null;
}

export function getGearDisplayWeightLabel(item: UserGear) {
  const grams = getGearDisplayWeightGrams(item);
  return typeof grams === "number" ? formatWeight(grams) : "-";
}

export function getProductDisplayTitle(product: GearProduct) {
  const baseName = product.name_ja ?? product.model;
  const productVolume = getProductVolume(product);

  if (
    isBackpackProduct(product) &&
    productVolume &&
    !baseName.includes(productVolume)
  ) {
    return `${baseName} (${productVolume})`;
  }

  return baseName;
}

export function getProductVolume(product: GearProduct) {
  if (product.volume) {
    return product.volume;
  }

  if (
    isBackpackProduct(product) &&
    product.capacity &&
    /(?:\d|L|リットル)/i.test(product.capacity)
  ) {
    return product.capacity;
  }

  return null;
}

export function isBackpackProduct(product: GearProduct) {
  return (
    normalizeGearText(product.gear_categories?.name_en ?? "") === "backpack" ||
    normalizeGearText(product.gear_subcategories?.name_en ?? "") === "backpack"
  );
}

export function compareGearBrands(a: string, b: string) {
  const priorityA = brandPriority.findIndex(
    (brand) => normalizeGearText(brand) === normalizeGearText(a)
  );
  const priorityB = brandPriority.findIndex(
    (brand) => normalizeGearText(brand) === normalizeGearText(b)
  );

  if (priorityA !== -1 || priorityB !== -1) {
    return (priorityA === -1 ? Number.MAX_SAFE_INTEGER : priorityA)
      - (priorityB === -1 ? Number.MAX_SAFE_INTEGER : priorityB);
  }

  return brandCollator.compare(a, b);
}

export function normalizeGearText(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/^ザ[・･]?/, "")
    .replace(/['’"“”`]/g, "")
    .replace(/[\s()\[\]{}（）【】「」『』・･/／\\_.。,，:：;；#＃+-]+/g, "");
}

const brandPriority = [
  "mont-bell",
  "山と道",
  "finetrack",
  "THE NORTH FACE",
  "Caravan",
  "Hyperlite Mountain Gear",
  "HMG",
  "Osprey",
  "Black Diamond",
  "Petzl",
  "NANGA",
  "ISUKA",
  "NEMO",
  "Therm-a-Rest",
  "SOTO",
  "EVERNEW",
  "アライテント",
  "MSR",
  "Garmin",
  "Salomon"
];
const brandCollator = new Intl.Collator("ja");
