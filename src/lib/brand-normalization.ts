type BrandAliasEntry = {
  canonical: string;
  aliases: readonly string[];
};

const brandAliasRegistry: readonly BrandAliasEntry[] = [
  {
    canonical: "mont-bell",
    aliases: ["montbell", "mont-bell", "Mont Bell", "Montbell", "モンベル"]
  },
  {
    canonical: "Black Diamond",
    aliases: [
      "blackdiamond",
      "black-diamond",
      "Black Diamond",
      "ブラックダイヤモンド"
    ]
  },
  {
    canonical: "THE NORTH FACE",
    aliases: [
      "the north face",
      "thenorthface",
      "the-north-face",
      "ノースフェイス",
      "ザノースフェイス",
      "ザ・ノース・フェイス"
    ]
  },
  {
    canonical: "Patagonia",
    aliases: ["patagonia", "パタゴニア"]
  },
  {
    canonical: "Therm-a-Rest",
    aliases: ["thermarest", "therm-a-rest", "Thermarest", "サーマレスト"]
  }
];

export function normalizeBrandKey(value: string) {
  return value
    .trim()
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/['’"“”`]/g, "")
    .replace(/[\s()\[\]{}（）【】「」『』・･/／\\_.。,，:：;；#＃+\-‐‑‒–—―−]+/g, "");
}

export function canonicalizeBrandName(
  value: string | null | undefined,
  canonicalBrands?: readonly string[]
) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return trimmed;
  }

  const key = normalizeBrandKey(trimmed);
  const canonicalBrandByKey = buildCanonicalBrandByKey(canonicalBrands);
  const directCanonical = canonicalBrandByKey.get(key);

  if (directCanonical) {
    return directCanonical;
  }

  const registryMatch = findBrandAliasEntry(key);

  if (registryMatch) {
    const registryCanonicalKey = normalizeBrandKey(registryMatch.canonical);
    return canonicalBrandByKey.get(registryCanonicalKey) ?? registryMatch.canonical;
  }

  return trimmed;
}

export function getBrandAliasesForQuery(
  value: string | null | undefined,
  canonicalBrands?: readonly string[]
) {
  const canonicalBrand = canonicalizeBrandName(value, canonicalBrands);

  if (!canonicalBrand) {
    return [];
  }

  const key = normalizeBrandKey(canonicalBrand);
  const registryMatch = findBrandAliasEntry(key);

  if (!registryMatch) {
    return [canonicalBrand];
  }

  return uniqueBrands([
    canonicalBrand,
    registryMatch.canonical,
    ...registryMatch.aliases
  ]);
}

function findBrandAliasEntry(key: string) {
  return brandAliasRegistry.find((entry) => {
    return [entry.canonical, ...entry.aliases].some(
      (alias) => normalizeBrandKey(alias) === key
    );
  });
}

function buildCanonicalBrandByKey(canonicalBrands?: readonly string[]) {
  const entries = canonicalBrands?.map((brand) => [
    normalizeBrandKey(brand),
    brand
  ] as const) ?? [];

  return new Map(entries);
}

function uniqueBrands(brands: readonly string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const brand of brands) {
    const trimmed = brand.trim();

    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    unique.push(trimmed);
  }

  return unique;
}
