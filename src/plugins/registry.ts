import { createSignal } from "solid-js";
import type {
  ContextMenuRegistration,
  CommandRegistration,
  MenuItemRegistration,
  IconProvider,
  ContextInfo,
  MenuContext,
  TitlebarItemRegistration,
  ExplorerToolbarItemRegistration,
} from "./types";
import type { ThemeColors } from "@/types";

class PluginRegistry {
  private contextMenuProviders: ContextMenuRegistration[] = [];
  private commandProviders: CommandRegistration[] = [];
  private cleanupFns: Map<string, (() => void) | undefined> = new Map();

  // SolidJS reactive signals for registers
  private menuItemsSignal;
  private setMenuItems;
  private themesSignal;
  private setThemes;
  private iconProvidersSignal;
  private setIconProviders;
  private commandsSignal;
  private setCommands;
  private titlebarItemsSignal;
  private setTitlebarItems;
  private explorerToolbarItemsSignal;
  private setExplorerToolbarItems;

  constructor() {
    const [menus, setMenus] = createSignal<MenuItemRegistration[]>([]);
    this.menuItemsSignal = menus;
    this.setMenuItems = setMenus;

    const [themes, setThemes] = createSignal<Map<string, ThemeColors>>(
      new Map(),
    );
    this.themesSignal = themes;
    this.setThemes = setThemes;

    const [icons, setIcons] = createSignal<IconProvider[]>([]);
    this.iconProvidersSignal = icons;
    this.setIconProviders = setIcons;

    const [commands, setCommands] = createSignal<CommandRegistration[]>([]);
    this.commandsSignal = commands;
    this.setCommands = setCommands;

    const [titlebarItems, setTitlebarItems] = createSignal<
      TitlebarItemRegistration[]
    >([]);
    this.titlebarItemsSignal = titlebarItems;
    this.setTitlebarItems = setTitlebarItems;

    const [explorerItems, setExplorerItems] = createSignal<
      ExplorerToolbarItemRegistration[]
    >([]);
    this.explorerToolbarItemsSignal = explorerItems;
    this.setExplorerToolbarItems = setExplorerItems;
  }

  registerContextMenuItem(registration: ContextMenuRegistration): void {
    this.contextMenuProviders = this.contextMenuProviders.filter(
      (r) => r.id !== registration.id,
    );
    this.contextMenuProviders.push(registration);
  }

  registerCommand(registration: CommandRegistration): void {
    this.commandProviders = this.commandProviders.filter(
      (r) => r.id !== registration.id,
    );
    this.commandProviders.push(registration);
    this.setCommands([...this.commandProviders]);
  }

  registerMenuItem(registration: MenuItemRegistration): void {
    const current = this.menuItemsSignal();
    // For MenuItemRegistration, we don't have an ID, we could filter by label if needed, but it's nested
    // We'll leave it as is or filter by menu + label
    const filtered = current.filter(
      (r) =>
        !(
          r.menu === registration.menu &&
          r.item.label === registration.item.label
        ),
    );
    this.setMenuItems([...filtered, registration]);
  }

  registerTheme(name: string, colors: ThemeColors): void {
    const current = new Map(this.themesSignal());
    current.set(name, colors);
    this.setThemes(current);
  }

  registerIconProvider(provider: IconProvider): void {
    const current = this.iconProvidersSignal();
    const filtered = current.filter((p) => p.id !== provider.id);
    this.setIconProviders([...filtered, provider]);
  }

  registerTitlebarItem(registration: TitlebarItemRegistration): void {
    const current = this.titlebarItemsSignal();
    const filtered = current.filter((r) => r.id !== registration.id);
    this.setTitlebarItems(
      [...filtered, registration].sort(
        (a, b) => (a.priority ?? 10) - (b.priority ?? 10),
      ),
    );
  }

  setCleanup(pluginId: string, fn: (() => void) | undefined): void {
    this.cleanupFns.set(pluginId, fn);
  }

  getContextMenuItems(
    context: MenuContext,
    ctx: ContextInfo,
  ): (ContextMenuRegistration | { separator: true; label: "" })[] {
    const matching = this.contextMenuProviders.filter(
      (item) => item.context === context && item.when(ctx),
    );

    if (matching.length === 0) return [];

    // Group items by pluginId.
    const groups = new Map<string, ContextMenuRegistration[]>();
    for (const item of matching) {
      const pluginId = item.pluginId ?? "core";
      if (!groups.has(pluginId)) {
        groups.set(pluginId, []);
      }
      groups.get(pluginId)!.push(item);
    }

    // Sort items within each group by priority.
    for (const groupItems of groups.values()) {
      groupItems.sort((a, b) => (a.priority ?? 10) - (b.priority ?? 10));
    }

    // Sort the groups by the lowest priority inside the group.
    const sortedGroups = Array.from(groups.entries()).sort(
      ([, itemsA], [, itemsB]) => {
        const pA = itemsA[0]?.priority ?? 10;
        const pB = itemsB[0]?.priority ?? 10;
        return pA - pB;
      },
    );

    // Flatten groups and insert separators between distinct plugin groups.
    const result: (ContextMenuRegistration | { separator: true; label: "" })[] =
      [];
    for (let i = 0; i < sortedGroups.length; i++) {
      if (i > 0) {
        result.push({ separator: true, label: "" });
      }
      result.push(...sortedGroups[i]![1]);
    }

    return result;
  }

  getCommands(): CommandRegistration[] {
    return this.commandsSignal();
  }

  getCommand(id: string): CommandRegistration | undefined {
    return this.commandsSignal().find((c) => c.id === id);
  }

  async executeCommand(id: string): Promise<void> {
    const cmd = this.commandsSignal().find((c) => c.id === id);
    if (cmd) await cmd.action();
  }

  getAllMenuItems(): MenuItemRegistration[] {
    return this.menuItemsSignal();
  }

  getThemes(): Map<string, ThemeColors> {
    return this.themesSignal();
  }

  getTheme(name: string): ThemeColors | undefined {
    return this.themesSignal().get(name);
  }

  getTitlebarItems(): TitlebarItemRegistration[] {
    return this.titlebarItemsSignal();
  }

  getIcon(
    name: string,
    isDirectory: boolean,
    expanded: boolean,
  ): Promise<string | undefined> | string | undefined {
    const providers = this.iconProvidersSignal();
    // Traverse providers from last registered to first
    for (let i = providers.length - 1; i >= 0; i--) {
      const provider = providers[i]!;
      if (isDirectory) {
        if (provider.getFolderIcon) {
          const icon = provider.getFolderIcon(name, expanded);
          if (icon) return icon;
        }
      } else {
        if (provider.getFileIcon) {
          const icon = provider.getFileIcon(name);
          if (icon) return icon;
        }
      }
    }
    return undefined;
  }

  registerExplorerToolbarItem(
    registration: ExplorerToolbarItemRegistration,
  ): void {
    this.setExplorerToolbarItems((prev: any) => {
      const filtered = prev.filter((r: any) => r.id !== registration.id);
      return [...filtered, registration];
    });
  }

  getExplorerToolbarItems(): ExplorerToolbarItemRegistration[] {
    return [...this.explorerToolbarItemsSignal()].sort(
      (a, b) => (a.priority ?? 100) - (b.priority ?? 100),
    );
  }

  deactivateAll(): void {
    for (const fn of this.cleanupFns.values()) {
      try {
        fn?.();
      } catch (err) {
        console.error("[rune] error cleaning up plugin", err);
      }
    }
    this.cleanupFns.clear();
    this.contextMenuProviders = [];
    this.commandProviders = [];
    this.setCommands([]);
    this.setMenuItems([]);
    this.setThemes(new Map());
    this.setIconProviders([]);
    this.setTitlebarItems([]);
    this.setExplorerToolbarItems([]);
  }
}

export const pluginRegistry = new PluginRegistry();
