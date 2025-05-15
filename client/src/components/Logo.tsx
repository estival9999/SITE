import { cn } from "@/lib/utils";
import logoImage from "@assets/logo Auralis.png";

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
      <img 
        src={logoImage}
        alt="Auralis Logo" 
        className={cn(sizes[size], "object-contain")}
      />
      
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
