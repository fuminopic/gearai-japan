import { cn } from "@/lib/utils/format";

type AppLogoProps = {
  className?: string;
};

export function AppLogo({ className }: AppLogoProps) {
  return (
    <img
      src="/yamajitaku-logo.png"
      alt="山支度 YAMAJITAKU"
      className={cn("h-12 w-auto object-contain", className)}
    />
  );
}
