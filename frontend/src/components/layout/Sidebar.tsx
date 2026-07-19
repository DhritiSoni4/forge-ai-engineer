import {
  FolderGit2,
  History,
  Sparkles,
  Settings,
} from "lucide-react";

const items = [
  { icon: FolderGit2, label: "Current Project" },
  { icon: History, label: "History" },
  { icon: Sparkles, label: "Agents" },
  { icon: Settings, label: "Settings" },
];

function Sidebar() {
  return (
    <aside className="hidden xl:flex w-72 flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

      <h2 className="mb-8 text-lg font-bold">
        Workspace
      </h2>

      <div className="space-y-2">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition hover:bg-white/5"
            >
              <Icon size={18} />

              {item.label}
            </button>
          );
        })}

      </div>

      <div className="mt-auto rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">

        <p className="text-sm text-zinc-300">
          Forge v0.2
        </p>

        <p className="mt-2 text-xs text-zinc-500">
          Multi-Agent Software Engineering Platform
        </p>

      </div>

    </aside>
  );
}

export default Sidebar;