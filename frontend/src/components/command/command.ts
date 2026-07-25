export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  group: string;
  shortcut?: string;
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
    subtitle: "Scroll to the planner",
    group: "Navigation",
    keywords: ["planner", "workspace", "home"],
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
    keywords: ["agents", "pipeline", "timeline"],
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
    keywords: ["github", "repository", "source"],
    action: () => {
      window.open(
        "https://github.com/DhritiSoni4/forge-ai-engineer",
        "_blank",
        "noopener,noreferrer"
      );
    },
  });
}