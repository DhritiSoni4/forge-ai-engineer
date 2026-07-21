import { motion } from "framer-motion";

interface MetadataCardProps {
  title: string;
  value: string;
}

const variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

function MetadataCard({
  title,
  value,
}: MetadataCardProps) {
  return (
    <motion.div
      variants={variants}
      whileHover={{
        y: -6,
        scale: 1.02,
      }}
      className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 backdrop-blur-xl"
    >
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </p>

      <h3 className="mt-3 text-xl font-semibold text-white">
        {value}
      </h3>
    </motion.div>
  );
}

export default MetadataCard;