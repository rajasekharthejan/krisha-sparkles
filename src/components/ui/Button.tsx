"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "gold", size = "md", loading, children, disabled, ...props },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-content gap-2 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variants = {
      gold: "btn-gold",
      outline: "btn-gold-outline",
      ghost:
        "bg-transparent text-[--muted] hover:text-[--gold] hover:bg-[rgba(201,168,76,0.08)] rounded px-4 py-2",
      danger:
        "bg-red-600/10 text-red-400 border border-red-600/20 hover:bg-red-600/20 rounded px-4 py-2",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], variant === "gold" || variant === "outline" ? sizes[size] : "", className)}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
