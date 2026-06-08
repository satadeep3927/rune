import type { RunePlugin, RuneAPI } from "../types";
import { agentStore } from "../../stores/agent";
import { pluginRegistry } from "../registry";

const agentPanelPlugin: RunePlugin = {
  id: "agent-panel",
  name: "Agent Panel",
  version: "1.0.0",
  type: "builtin",
  permissions: ["fs.read", "fs.write", "process.exec"],

  activate(api: RuneAPI) {
    api.ui.registerCommand({
      id: "agent.new-session",
      label: "Agent: New Session",
      shortcut: "Ctrl+Shift+A",
      category: "Agent",
      action: () => {
        const providers = pluginRegistry.getAgentProviders();
        if (providers.length === 0) {
          api.ui.showMessage("No agent providers registered. Configure a provider in Settings.");
          return;
        }
        agentStore.openSession(providers[0]!.id);
      },
    });

    api.ui.registerCommand({
      id: "agent.new-session-pick",
      label: "Agent: New Session with Provider",
      category: "Agent",
      action: async () => {
        const providers = pluginRegistry.getAgentProviders();
        if (providers.length === 0) {
          api.ui.showMessage("No agent providers registered. Configure a provider in Settings.");
          return;
        }
        if (providers.length === 1) {
          agentStore.openSession(providers[0]!.id);
          return;
        }
        const picked = await api.ui.showQuickPick(
          providers.map((p) => ({
            id: p.id,
            label: p.name,
            detail: p.description,
          })),
          { placeholder: "Select agent provider..." },
        );
        if (picked) {
          agentStore.openSession(picked);
        }
      },
    });

    api.ui.registerMenuItem({
      menu: "View",
      item: {
        label: "Agent: New Session",
        accelerator: "Ctrl+Shift+A",
        action: () => {
          const providers = pluginRegistry.getAgentProviders();
          if (providers.length > 0) {
            agentStore.openSession(providers[0]!.id);
          }
        },
      },
      priority: 25,
    });
  },
};

export default agentPanelPlugin;
