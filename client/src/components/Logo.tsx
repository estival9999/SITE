import { cn } from "@/lib/utils";
import logoImage from "@assets/logo Auralis.png";

interface LogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
  withText?: boolean;
}

export function Logo({ className, size = "medium", withText = false }: LogoProps) {
  const sizes = {
    small: "h-8 w-auto",
    medium: "h-12 w-auto",
    large: "h-24 w-auto",
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
          "ml-3 font-bold",
          size === "small" && "text-sm",
          size === "medium" && "text-xl",
          size === "large" && "text-3xl"
        )}>
          Auralis
        </span>
      )}
    </div>
  );
}

export default Logo;
