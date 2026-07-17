import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

function Button({
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-2xl
        bg-indigo-600
        px-6
        py-3
        font-semibold
        text-white
        transition-all
        duration-300
        hover:bg-indigo-500
        hover:shadow-lg
        hover:shadow-indigo-500/30
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${className}
      `}
      {...props}
    >
      {loading && (
        <Loader2 className="h-5 w-5 animate-spin" />
      )}

      {children}
    </button>
  );
}

export default Button;