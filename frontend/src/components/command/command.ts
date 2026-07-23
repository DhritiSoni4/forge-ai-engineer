export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  keywords?: string[];
  group: string;
  shortcut?: string;
  action: () => void;
}

export class CommandRegistry {
  private commands = new Map<string, CommandItem>();

  register(command: CommandItem) {
    this.commands.set(command.id, command);
  }

  unregister(id: string) {
    this.commands.delete(id);
  }

  getCommands() {
    return Array.from(this.commands.values()).sort((a, b) => {
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
    title: "Planner",
    subtitle: "Go to planner workspace",
    group: "Navigation",
    keywords: ["plan", "workspace", "home"],
    action: () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    },
  });

  commandRegistry.register({
    id: "agents",
    title: "Agents",
    subtitle: "Go to execution pipeline",
    group: "Navigation",
    keywords: ["timeline", "pipeline"],
    action: () => {
      document
        .querySelector("#agents")
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
    keywords: ["repo", "source", "code"],
    action: () => {
      window.open(
        "https://github.com/DhritiSoni4/forge-ai-engineer",
        "_blank",
        "noopener,noreferrer"
      );
    },
  });
}