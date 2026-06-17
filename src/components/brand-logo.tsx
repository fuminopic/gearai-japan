import { normalizeGearText } from "@/lib/gear-display";
import { cn } from "@/lib/utils/format";

type BrandLogoProps = {
  brand: string;
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ brand, className, compact = false }: BrandLogoProps) {
  const key = normalizeGearText(brand);
  const baseClass = cn("h-7 w-24 shrink-0", className);
  const shortClass = cn("h-7 w-14 shrink-0", className);
  const compactClass = cn("h-6 w-10 shrink-0", className);

  if (compact) {
    if (key === "thenorthface") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 42 34" className={cn("h-6 w-8 shrink-0", className)}>
          <path
            d="M21 5c10.5 0 18.5 8.5 18.5 18.5h-4.2c0-8.1-6.3-14.4-14.3-14.4V5Zm0 7.2c6.5 0 11.7 5.2 11.7 11.7h-4.2c0-4.2-3.4-7.6-7.5-7.6v-4.1Zm0 7.7c2.7 0 4.9 2.2 4.9 4.9h-4.9v-4.9Z"
            fill="currentColor"
          />
        </svg>
      );
    }

    if (key === "blackdiamond") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 32 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M16 4 29 17 16 30 3 17 16 4Z" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" />
          <path d="M16 10 23 17 16 24 9 17 16 10Z" fill="currentColor" />
        </svg>
      );
    }

    if (key === "montbell") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M5 23 14 10l9 13H5Z" fill="#2B5F8A" />
          <path d="M11 23 17 14l6 9H11Z" fill="#F5C74E" />
        </svg>
      );
    }

    if (key === "山と道") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M5 24 14 12l5 8 5-7 5 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }

    if (key === "hyperlitemountaingear" || key === "hmg") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M6 24 12 11l5 9 5-9 6 13H6Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M12 24h10" stroke="#7A7A7A" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    }

    if (key === "finetrack") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M6 23c6-10 8-10 14 0 4-7 5-7 8-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 11h18" stroke="#2B5F8A" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    }

    if (key === "caravan") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M7 22 17 9l10 13H7Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <circle cx="13" cy="24" r="2" fill="currentColor" />
          <circle cx="21" cy="24" r="2" fill="currentColor" />
        </svg>
      );
    }

    if (key === "osprey") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M6 19c6-8 16-8 22 0-7-3-14-3-22 0Z" fill="currentColor" />
        </svg>
      );
    }

    if (key === "petzl") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <circle cx="15" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M20 10 27 6" stroke="#C35B2D" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    }

    if (key === "nanga") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M5 24 13 13l4 5 5-7 7 13H5Z" fill="#C34A2C" />
        </svg>
      );
    }

    if (key === "isuka") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M6 24 14 12l4 6 4-4 6 10H6Z" fill="#C9362B" />
        </svg>
      );
    }

    if (key === "nemo") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M6 24c4-8 8-12 11-12s7 4 11 12H6Z" fill="#F47B20" />
        </svg>
      );
    }

    if (key === "thermarest") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-8 shrink-0", className)}>
          <path d="M5 19c6 3 13 3 24 0" fill="none" stroke="#C7332C" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M8 24c4 1 8 1 16 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    }

    if (key === "soto") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M8 10h18v12H8V10Z" fill="#1F5D8C" />
          <path d="M13 21c2-3 6-4 8 0" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    if (key === "evernew") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M8 10h18l-2 11H10L8 10Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      );
    }

    if (key === "アライテント") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M7 24 17 9l10 15H7Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      );
    }

    if (key === "msr") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M7 23 16 10l9 13H7Z" fill="#C7332C" />
        </svg>
      );
    }

    if (key === "garmin") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M17 6 24 17 17 28 10 17 17 6Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M17 11v12" stroke="#2B5F8A" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    }

    if (key === "salomon") {
      return (
        <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={cn("h-6 w-6 shrink-0", className)}>
          <path d="M8 22c4-8 12-12 18-12-5 4-8 10-8 18-3-4-6-6-10-6Z" fill="currentColor" />
        </svg>
      );
    }

    return (
      <svg role="img" aria-label={brand} viewBox="0 0 34 34" className={compactClass}>
        <circle cx="17" cy="17" r="11" fill="currentColor" opacity="0.12" />
      </svg>
    );
  }

  if (key === "thenorthface") {
    return (
      <svg
        role="img"
        aria-label={brand}
        viewBox="0 0 96 34"
        className={baseClass}
      >
        <path
          d="M67 7c10 0 18 8 18 18h-5c0-7.3-5.7-13-13-13V7Zm0 6.5c6.4 0 11.5 5.1 11.5 11.5h-5c0-3.6-2.9-6.5-6.5-6.5v-5Zm0 6.5c2.8 0 5 2.2 5 5h-5v-5Z"
          fill="currentColor"
        />
        <text x="4" y="13" fill="currentColor" fontSize="8" fontWeight="900">
          THE
        </text>
        <text x="4" y="22" fill="currentColor" fontSize="8" fontWeight="900">
          NORTH
        </text>
        <text x="4" y="31" fill="currentColor" fontSize="8" fontWeight="900">
          FACE
        </text>
      </svg>
    );
  }

  if (key === "blackdiamond") {
    return (
      <svg
        role="img"
        aria-label={brand}
        viewBox="0 0 54 34"
        className={shortClass}
      >
        <path
          d="M27 4 49 17 27 30 5 17 27 4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M27 10 38.5 17 27 24 15.5 17 27 10Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (key === "montbell") {
    return (
      <svg
        role="img"
        aria-label={brand}
        viewBox="0 0 104 34"
        className={baseClass}
      >
        <path d="M7 22 18 8l11 14H7Z" fill="#2B5F8A" />
        <path d="M14 22 22 12l8 10H14Z" fill="#F5C74E" />
        <text x="36" y="22" fill="currentColor" fontSize="13" fontWeight="700">
          mont-bell
        </text>
      </svg>
    );
  }

  if (key === "山と道") {
    return (
      <svg
        role="img"
        aria-label={brand}
        viewBox="0 0 92 34"
        className={baseClass}
      >
        <path d="M7 25 21 8l11 17 9-10 10 10" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <text x="58" y="23" fill="currentColor" fontSize="13" fontWeight="700">
          山と道
        </text>
      </svg>
    );
  }

  if (key === "hyperlitemountaingear" || key === "hmg") {
    return <WordmarkLogo brand={brand} label="HMG" className={shortClass} bold />;
  }

  if (key === "finetrack") {
    return <WordmarkLogo brand={brand} label="finetrack" className={baseClass} />;
  }

  if (key === "caravan") {
    return <WordmarkLogo brand={brand} label="Caravan" className={baseClass} />;
  }

  if (key === "osprey") {
    return (
      <svg
        role="img"
        aria-label={brand}
        viewBox="0 0 96 34"
        className={baseClass}
      >
        <path d="M12 19c9-12 22-12 31 0-11-5-21-5-31 0Z" fill="currentColor" />
        <text x="48" y="23" fill="currentColor" fontSize="13" fontWeight="900">
          OSPREY
        </text>
      </svg>
    );
  }

  if (key === "petzl") {
    return <WordmarkLogo brand={brand} label="PETZL" className={shortClass} bold />;
  }

  if (key === "nanga") {
    return (
      <svg
        role="img"
        aria-label={brand}
        viewBox="0 0 96 34"
        className={baseClass}
      >
        <path d="M8 23 20 10l7 8 6-6 12 11" fill="none" stroke="#C34A2C" strokeWidth="2.5" />
        <text x="50" y="23" fill="currentColor" fontSize="13" fontWeight="900">
          NANGA
        </text>
      </svg>
    );
  }

  if (key === "isuka") {
    return (
      <svg
        role="img"
        aria-label={brand}
        viewBox="0 0 88 34"
        className={baseClass}
      >
        <path d="M9 24 23 8l7 16H9Z" fill="#C9362B" />
        <path d="M24 24 32 12l6 12H24Z" fill="currentColor" />
        <text x="44" y="23" fill="currentColor" fontSize="13" fontWeight="900">
          ISUKA
        </text>
      </svg>
    );
  }

  if (key === "nemo") {
    return (
      <svg
        role="img"
        aria-label={brand}
        viewBox="0 0 88 34"
        className={baseClass}
      >
        <path d="M9 25c7-14 20-14 27 0H9Z" fill="#F47B20" />
        <text x="43" y="23" fill="currentColor" fontSize="14" fontWeight="900">
          NEMO
        </text>
      </svg>
    );
  }

  if (key === "thermarest") {
    return (
      <svg
        role="img"
        aria-label={brand}
        viewBox="0 0 112 34"
        className={cn("h-7 w-28 shrink-0", className)}
      >
        <text x="3" y="21" fill="currentColor" fontSize="11" fontWeight="800">
          Therm-a-Rest
        </text>
        <path d="M5 26c24 5 55 5 92 0" fill="none" stroke="#C7332C" strokeWidth="2.2" />
      </svg>
    );
  }

  if (key === "soto") {
    return (
      <svg
        role="img"
        aria-label={brand}
        viewBox="0 0 70 34"
        className={shortClass}
      >
        <path d="M8 8h54v18H8V8Z" fill="#1F5D8C" />
        <text x="16" y="22" fill="white" fontSize="13" fontWeight="900">
          SOTO
        </text>
      </svg>
    );
  }

  if (key === "evernew") {
    return <WordmarkLogo brand={brand} label="EVERNEW" className={baseClass} bold />;
  }

  if (key === "アライテント") {
    return <WordmarkLogo brand={brand} label="ARAI" className={shortClass} bold />;
  }

  if (key === "msr") {
    return <WordmarkLogo brand={brand} label="MSR" className={shortClass} bold />;
  }

  if (key === "garmin") {
    return <WordmarkLogo brand={brand} label="GARMIN" className={baseClass} bold />;
  }

  if (key === "salomon") {
    return <WordmarkLogo brand={brand} label="SALOMON" className={baseClass} bold />;
  }

  return (
    <span className="inline-flex min-h-7 items-center text-sm font-bold leading-none tracking-normal">
      {brand}
    </span>
  );
}

function WordmarkLogo({
  brand,
  label,
  className,
  bold = false
}: {
  brand: string;
  label: string;
  className: string;
  bold?: boolean;
}) {
  return (
    <svg role="img" aria-label={brand} viewBox="0 0 96 34" className={className}>
      <text
        x="4"
        y="23"
        fill="currentColor"
        fontSize={bold ? "15" : "13"}
        fontWeight={bold ? "900" : "800"}
      >
        {label}
      </text>
    </svg>
  );
}
