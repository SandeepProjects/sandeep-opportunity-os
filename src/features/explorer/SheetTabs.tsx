import React, { useRef } from "react";
import type { SheetTabConfig } from "./explorerData";

interface SheetTabsProps {
  tabs: SheetTabConfig[];
  selectedTabId: string;
  onSelectTab: (tabId: string) => void;
  counts?: Record<string, number>;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  tabs,
  selectedTabId,
  onSelectTab,
  counts = {}
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollLeft = () => {
    containerRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    containerRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="os-sheet-tabs-wrapper" role="region" aria-label="Sheet Internal Tabs">
      <div className="os-sheet-tabs-container" ref={containerRef} role="tablist">
        {tabs.map((tab) => {
          const isSelected = selectedTabId === tab.id;
          const count = counts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`os-sheet-tab ${isSelected ? "active" : ""}`}
              onClick={() => onSelectTab(tab.id)}
            >
              <span className="os-sheet-tab-icon" aria-hidden="true">
                {isSelected ? "📋" : "📄"}
              </span>
              <span className="os-sheet-tab-label">{tab.label}</span>
              {count !== undefined && (
                <span className="os-sheet-tab-count mono">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {tabs.length > 4 && (
        <div className="os-sheet-tabs-scroll-controls" aria-hidden="true">
          <button
            type="button"
            className="os-tab-scroll-btn"
            onClick={scrollLeft}
            aria-label="Scroll tabs left"
            title="Scroll tabs left"
          >
            ‹
          </button>
          <button
            type="button"
            className="os-tab-scroll-btn"
            onClick={scrollRight}
            aria-label="Scroll tabs right"
            title="Scroll tabs right"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
};
