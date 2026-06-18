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
    wrapperClassName?: string;
  }
> = {
  montbell: {
    src: "/brand-logos/mont-bell.png",
    alt: "mont-bell"
  },
  thenorthface: {
    src: "/brand-logos/the-north-face.png",
    alt: "THE NORTH FACE"
  },
  blackdiamond: {
    src: "/brand-logos/black-diamond.png",
    alt: "Black Diamond",
    className: "max-h-6 max-w-[4.75rem]"
  },
  nanga: {
    src: "/brand-logos/nanga.webp",
    alt: "NANGA",
    className: "max-h-4 max-w-[4.75rem]",
    wrapperClassName: "rounded-md bg-ink px-2"
  },
  isuka: {
    src: "/brand-logos/isuka.gif",
    alt: "ISUKA",
    className: "max-h-6 max-w-[4.75rem]"
  },
  nemo: {
    src: "/brand-logos/nemo.png",
    alt: "NEMO",
    className: "max-h-6 max-w-[4.75rem]"
  },
  thermarest: {
    src: "/brand-logos/therm-a-rest.png",
    alt: "Therm-a-Rest"
  },
  soto: {
    src: "/brand-logos/soto.png",
    alt: "SOTO"
  },
  finetrack: {
    src: "/brand-logos/finetrack.png",
    alt: "finetrack"
  },
  petzl: {
    src: "/brand-logos/petzl.png",
    alt: "Petzl",
    className: "max-h-6 max-w-[4.75rem]"
  },
  caravan: {
    src: "/brand-logos/logo-open.png",
    alt: "Caravan"
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
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        compact ? "h-7 w-[5.75rem]" : "h-8 w-[8.25rem]",
        logo.wrapperClassName,
        className
      )}
    >
      <img
        src={logo.src}
        alt={logo.alt}
        className={cn("max-h-full max-w-full object-contain", logo.className)}
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
        compact ? "w-[5.75rem]" : "w-[8.25rem]",
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
