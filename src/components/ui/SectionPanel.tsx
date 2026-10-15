import React from "react";

interface SectionPanelProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export const SectionPanel: React.FC<SectionPanelProps> = ({
  title,
  subtitle,
  rightSlot,
  children
}) => (
  <section className="os-panel">
    <header className="os-panel-header">
      <div>
        <h2 className="os-panel-title">{title}</h2>
        {subtitle && <p className="os-panel-subtitle">{subtitle}</p>}
      </div>
      {rightSlot && <div>{rightSlot}</div>}
    </header>
    <div>{children}</div>
  </section>
);
