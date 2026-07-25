import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import { Search } from "lucide-react";

import { commandRegistry } from "./commands";
import { useCommandPalette } from "./CommandProvider";

function CommandPalette() {
  const { open, setOpen } = useCommandPalette();

  const commands = useMemo(
    () => commandRegistry.getCommands(),
    [open]
  );

  const groups = useMemo(() => {
    return commands.reduce<Record<string, typeof commands>>(
      (acc, command) => {
        if (!acc[command.group]) {
          acc[command.group] = [];
        }

        acc[command.group].push(command);

        return acc;
      },
      {}
    );
  }, [commands]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          <motion.div
            className="fixed left-1/2 top-24 z-[100] w-full max-w-2xl -translate-x-1/2 px-4"
            initial={{
              opacity: 0,
              y: -20,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -12,
              scale: 0.98,
            }}
            transition={{
              duration: 0.18,
            }}
          >
            <Command
              className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl"
            >
              <div className="flex items-center border-b border-white/10 px-4">
                <Search
                  size={18}
                  className="text-zinc-500"
                />

                <CommandInput
                  autoFocus
                  placeholder="Search commands..."
                  className="h-14 w-full bg-transparent px-3 text-sm outline-none placeholder:text-zinc-500"
                />
              </div>

              <CommandList className="max-h-[420px] overflow-y-auto p-2">
                <CommandEmpty className="py-10 text-center text-sm text-zinc-500">
                  No commands found.
                </CommandEmpty>

                {Object.entries(groups).map(
                  ([group, items]) => (
                    <CommandGroup
                      key={group}
                      heading={group}
                    >
                      {items.map((command) => (
                        <CommandItem
                          key={command.id}
                          value={`${command.title} ${command.keywords?.join(
                            " "
                          )}`}
                          onSelect={() => {
                            command.action();
                            setOpen(false);
                          }}
                          className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-sm text-zinc-200 aria-selected:bg-violet-500/20"
                        >
                          <div>
                            <p>{command.title}</p>

                            {command.subtitle && (
                              <p className="mt-1 text-xs text-zinc-500">
                                {command.subtitle}
                              </p>
                            )}
                          </div>

                          {command.shortcut && (
                            <span className="rounded bg-white/5 px-2 py-1 text-xs text-zinc-500">
                              {command.shortcut}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )
                )}
              </CommandList>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;