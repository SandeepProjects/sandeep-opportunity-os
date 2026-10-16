import React from "react";
import {
  WORKSPACE_AGENTS,
  type ExplorerAgent,
  type ExplorerAgentId
} from "./explorerData";

interface AgentSwitcherProps {
  selectedAgentId?: ExplorerAgentId;
  onSelectAgent: (agent: ExplorerAgent) => void;
}

export const AgentSwitcher: React.FC<AgentSwitcherProps> = ({
  selectedAgentId,
  onSelectAgent
}) => {
  return (
    <div className="os-agent-switcher-container" aria-label="Workspace Agents Selection">
      <div className="os-nav-group-label" style={{ padding: "8px 12px 4px", letterSpacing: "0.05em" }}>
        WORKSPACE AGENTS
      </div>
      <div className="os-agent-switcher-list" role="tablist" aria-label="Workspace Agents">
        {WORKSPACE_AGENTS.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          return (
            <button
              key={agent.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`os-agent-item ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectAgent(agent)}
              title={`${agent.name} — ${agent.role}`}
            >
              <div
                className="os-agent-avatar"
                style={{
                  backgroundColor: agent.themeColor,
                  color: "#ffffff"
                }}
              >
                {agent.initials}
                <span
                  className="os-agent-status-dot"
                  title="Agent Online & Monitoring"
                  aria-hidden="true"
                />
              </div>

              <div className="os-agent-meta">
                <div className="os-agent-name">{agent.name}</div>
                <div className="os-agent-role">{agent.role}</div>
              </div>

              {isSelected && (
                <span className="os-agent-active-indicator" aria-hidden="true">
                  •
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
