import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`forge-button ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;