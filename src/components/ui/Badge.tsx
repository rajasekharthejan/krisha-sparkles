import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "green" | "red" | "blue" | "purple" | "amber";
  className?: string;
}

export default function Badge({ children, variant = "gold", className }: BadgeProps) {
  const variants = {
    gold: "badge-gold",
    green: "status-paid status-badge",
    red: "status-cancelled status-badge",
    blue: "status-shipped status-badge",
    purple: "status-delivered status-badge",
    amber: "status-pending status-badge",
  };

  return (
    <span className={cn(variants[variant], className)}>
      {children}
    </span>
  );
}
