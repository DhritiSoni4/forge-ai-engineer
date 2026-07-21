import {
  FolderGit2,
  History,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";

import type { HistoryProject } from "../../types/history";
import { formatRelativeTime } from "../../services/history";

interface SidebarProps {
  history: HistoryProject[];
  onSelectProject: (project: HistoryProject) => void;
  onDeleteProject: (id: string) => void;
}

function Sidebar({
  history,
  onSelectProject,
  onDeleteProject,
}: SidebarProps) {
  return (
    <aside className="hidden xl:flex w-72 flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-bold">
          Workspace
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Recent Projects
        </p>
      </div>

      <div className="mt-6 flex-1 overflow-y-auto space-y-3">
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center">
            <History className="mx-auto mb-3 text-zinc-600" size={22} />

            <p className="text-sm text-zinc-500">
              No projects yet.
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Generate a plan to see it here.
            </p>
          </div>
        ) : (
          history.map((project) => (
            <div
              key={project.id}
              className="group rounded-2xl border border-white/10 bg-zinc-900/60 p-4 transition hover:border-violet-500"
            >
              <button
                onClick={() => onSelectProject(project)}
                className="w-full text-left"
              >
                <p className="truncate font-medium">
                  {project.plan.project_name}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  {formatRelativeTime(project.createdAt)}
                </p>
              </button>

              <button
                onClick={() => onDeleteProject(project.id)}
                className="mt-3 flex items-center gap-2 text-xs text-zinc-500 transition hover:text-red-400"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 space-y-2">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-white/5">
          <FolderGit2 size={18} />
          Current Project
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-white/5">
          <Sparkles size={18} />
          Agents
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-white/5">
          <Settings size={18} />
          Settings
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
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