import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
}

function Badge({ children }: BadgeProps) {
  return (
    <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300">
      {children}
    </span>
  );
}

export default Badge;