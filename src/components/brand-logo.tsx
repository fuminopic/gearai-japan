import { normalizeGearText } from "@/lib/gear-display";
import { cn } from "@/lib/utils/format";

type BrandLogoProps = {
  brand: string;
  className?: string;
  compact?: boolean;
};

const officialBrandLogos: Record<
  string,
  {
    src: string;
    alt: string;
    className?: string;
  }
> = {
  thenorthface: {
    src: "https://www.goldwin.co.jp/static/full/tnf/assets/images/logo.svg",
    alt: "THE NORTH FACE",
    className: "object-contain"
  }
};

export function BrandLogo({ brand, className, compact = false }: BrandLogoProps) {
  const logo = officialBrandLogos[normalizeGearText(brand)];

  if (!logo) {
    return <BrandName brand={brand} compact={compact} className={className} />;
  }

  return (
    <span
      role="img"
      aria-label={logo.alt}
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        compact ? "h-6 w-16" : "h-7 w-28",
        className
      )}
    >
      <img
        src={logo.src}
        alt={logo.alt}
        className={cn("max-h-full max-w-full", logo.className)}
        loading="lazy"
      />
    </span>
  );
}

function BrandName({
  brand,
  compact,
  className
}: {
  brand: string;
  compact: boolean;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={brand}
      className={cn(
        "inline-flex h-6 shrink-0 items-center justify-center whitespace-nowrap text-sm font-semibold leading-none tracking-normal",
        compact ? "max-w-28" : "max-w-36",
        className
      )}
    >
      {formatBrandName(brand, compact)}
    </span>
  );
}

function formatBrandName(brand: string, compact: boolean) {
  if (!compact) {
    return brand;
  }

  const normalized = normalizeGearText(brand);

  if (normalized === "blackdiamond") {
    return "Black Diamond";
  }

  if (normalized === "hyperlitemountaingear") {
    return "HMG";
  }

  if (normalized === "thermarest") {
    return "Therm-a-Rest";
  }

  return brand;
}
