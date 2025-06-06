import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
  withText?: boolean;
}

export function Logo({ className, size = "medium", withText = false }: LogoProps) {
  const sizes = {
    small: "h-10 w-auto",
    medium: "h-16 w-auto",
    large: "h-32 w-auto",
  };

  return (
    <div className={cn("flex justify-center", className)}>
      <img 
        src="/images/logo-auralis.png"
        alt="Auralis Logo" 
        className={cn(sizes[size], "object-contain")}
      />
    </div>
  );
}

export default Logo;
