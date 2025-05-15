import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
  withText?: boolean;
}

export function Logo({ className, size = "medium", withText = false }: LogoProps) {
  const sizes = {
    small: "h-6 w-auto",
    medium: "h-8 w-auto",
    large: "h-20 w-auto",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <svg 
        className={cn(sizes[size], "fill-current text-white")} 
        viewBox="0 0 400 400" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M200 0L385.566 200L200 400L14.434 200L200 0Z" />
        <path d="M180 240H340L200 80L60 220H140L200 160L240 200H160L180 240Z" fill="currentColor" opacity="0.8" />
      </svg>
      
      {withText && (
        <span className={cn(
          "ml-2 font-semibold",
          size === "small" && "text-sm",
          size === "medium" && "text-lg",
          size === "large" && "text-2xl"
        )}>
          Auralis
        </span>
      )}
    </div>
  );
}

export default Logo;
