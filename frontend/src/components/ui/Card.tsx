import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;