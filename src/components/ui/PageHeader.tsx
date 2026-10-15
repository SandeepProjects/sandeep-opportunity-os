import React from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actions
}) => (
  <header className="os-page-header">
    <div>
      <p className="os-page-eyebrow">{eyebrow}</p>
      <h1 className="os-page-title">{title}</h1>
      {subtitle && <p className="os-page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="os-page-actions">{actions}</div>}
  </header>
);
