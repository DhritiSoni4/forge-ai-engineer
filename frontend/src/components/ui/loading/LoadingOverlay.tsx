import { AnimatePresence, motion } from "framer-motion";

import { useLoading } from "./LoadingProvider";

function LoadingOverlay() {
  const { isLoading, message } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 8,
            }}
            transition={{
              duration: 0.2,
            }}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950/90 p-8 text-center shadow-2xl"
          >
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                repeat: Infinity,
                duration: 1,
                ease: "linear",
              }}
              className="mx-auto mb-6 h-12 w-12 rounded-full border-4 border-violet-500 border-t-transparent"
            />

            <h2 className="text-lg font-semibold text-white">
              Forge is working...
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              {message}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoadingOverlay;