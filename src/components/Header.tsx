import { Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, onMenuToggle, actions }: HeaderProps) {
  return (
    <header className="app-header">
      {/* Right: menu + title */}
      <div className="header-right">
        <button onClick={onMenuToggle} className="menu-btn">
          <Menu size={20} />
        </button>
        <div className="header-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {/* Left: action buttons (e.g. حفظ التغييرات) */}
      <div className="header-actions">
        {actions}
      </div>
    </header>
  );
}
