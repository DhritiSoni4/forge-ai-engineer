import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import {
  FolderGit2,
  LayoutDashboard,
} from "lucide-react";

import type { HistoryProject } from "../../types/history";
export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  group: string;
  shortcut?: string;
  icon?: ComponentType<LucideProps>;
  action: () => void;
}

class CommandRegistry {
  private commands = new Map<string, CommandItem>();

  register(command: CommandItem) {
    this.commands.set(command.id, command);
  }

  unregister(id: string) {
    this.commands.delete(id);
  }

  clearGroup(group: string) {
    [...this.commands.values()]
      .filter((command) => command.group === group)
      .forEach((command) => this.commands.delete(command.id));
  }

  getCommands(): CommandItem[] {
    return [...this.commands.values()].sort((a, b) => {
      if (a.group === b.group) {
        return a.title.localeCompare(b.title);
      }

      return a.group.localeCompare(b.group);
    });
  }

  clear() {
    this.commands.clear();
  }
}

export const commandRegistry = new CommandRegistry();

export function registerDefaultCommands() {
  commandRegistry.clear();

  commandRegistry.register({
    id: "planner",
    title: "Planner Workspace",
    subtitle: "Scroll to planner",
    group: "Navigation",
    keywords: ["planner", "workspace"],
    shortcut: "⌘P",
    action: () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
  });

  commandRegistry.register({
    id: "agents",
    title: "Agent Timeline",
    subtitle: "View execution pipeline",
    group: "Navigation",
    icon: LayoutDashboard,
    keywords: ["pipeline", "timeline"],
    action: () => {
      document
        .getElementById("agents")
        ?.scrollIntoView({
          behavior: "smooth",
        });
    },
  });

  commandRegistry.register({
    id: "github",
    title: "Open GitHub Repository",
    subtitle: "Forge AI Engineer",
    group: "Links",
    icon: FolderGit2,
    keywords: ["github", "repository"],
    action: () => {
      window.open(
        "https://github.com/DhritiSoni4/forge-ai-engineer",
        "_blank",
        "noopener,noreferrer"
      );
    },
  });
}

export function registerRecentProjects(
  history: HistoryProject[],
  onSelect: (project: HistoryProject) => void
) {
  commandRegistry.clearGroup("Projects");

  history.slice(0, 10).forEach((project) => {
    commandRegistry.register({
      id: `project-${project.id}`,
      title: project.plan.project_name,
      subtitle: project.prompt,
      group: "Projects",
      icon: FolderGit2,
      keywords: [
        project.plan.project_name,
        project.prompt,
      ],
      action: () => onSelect(project),
    });
  });
}