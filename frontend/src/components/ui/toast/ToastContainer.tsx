import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

import { useToast } from "./ToastProvider";
import type { ToastVariant } from "./ToastProvider";

const icons: Record<
  ToastVariant,
  React.ElementType
> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
};

const accent: Record<ToastVariant, string> = {
  success: "border-emerald-500/40",
  error: "border-red-500/40",
  warning: "border-amber-500/40",
  info: "border-violet-500/40",
};

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed right-6 top-6 z-[999] flex w-[380px] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.variant];

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{
                opacity: 0,
                y: -20,
                scale: 0.96,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -10,
                scale: 0.96,
              }}
              transition={{
                duration: 0.18,
              }}
              className={`pointer-events-auto rounded-2xl border ${accent[toast.variant]} bg-zinc-950/95 shadow-2xl backdrop-blur-xl`}
            >
              <div className="flex items-start gap-3 p-4">
                <Icon
                  size={20}
                  className="mt-0.5 text-violet-400"
                />

                <div className="flex-1">
                  <p className="font-medium text-white">
                    {toast.title}
                  </p>

                  {toast.description && (
                    <p className="mt-1 text-sm text-zinc-400">
                      {toast.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() =>
                    removeToast(toast.id)
                  }
                  className="rounded-lg p-1 text-zinc-500 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;