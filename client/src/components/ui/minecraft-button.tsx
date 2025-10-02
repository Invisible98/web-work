import { forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MinecraftButtonProps extends ButtonProps {
  variant?: "primary" | "secondary" | "destructive" | "accent";
}

export const MinecraftButton = forwardRef<HTMLButtonElement, MinecraftButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground border-secondary hover:bg-secondary/90",
      destructive: "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90",
      accent: "bg-accent text-accent-foreground border-accent hover:bg-accent/90",
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "minecraft-btn font-pixel text-xs uppercase",
          "relative border-3 shadow-[4px_4px_0_rgba(0,0,0,0.5)]",
          "hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_rgba(0,0,0,0.5)]",
          "active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,0.5)]",
          "transition-all duration-100 ease-in-out",
          "disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_rgba(0,0,0,0.5)]",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

MinecraftButton.displayName = "MinecraftButton";
