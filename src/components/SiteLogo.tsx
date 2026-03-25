interface SiteLogoProps {
  size?: number;
  showText?: boolean;
}

export default function SiteLogo({ size = 38, showText = true }: SiteLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, borderRadius: Math.round(size * 0.2) }}>
        <rect width="64" height="64" rx="14" fill="#00b5a3"/>
        {/* Wood plank */}
        <rect x="8" y="29" width="48" height="9" rx="2.5" fill="rgba(255,255,255,0.15)"/>
        {/* Left handle ring */}
        <circle cx="19" cy="18" r="7.5" stroke="white" strokeWidth="3" fill="none"/>
        <circle cx="19" cy="18" r="2.5" fill="white"/>
        {/* Right handle ring */}
        <circle cx="45" cy="18" r="7.5" stroke="white" strokeWidth="3" fill="none"/>
        <circle cx="45" cy="18" r="2.5" fill="white"/>
        {/* Blade left → down-right */}
        <line x1="24.5" y1="23.5" x2="45" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        {/* Blade right → down-left */}
        <line x1="39.5" y1="23.5" x2="19" y2="50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        {/* Cut dashes on plank */}
        <line x1="32" y1="27" x2="32" y2="40" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2.5 2.5" opacity="0.6"/>
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, overflow: 'hidden' }}>
          <span style={{ fontSize: size * 0.47, fontWeight: 900, color: '#ffffff', letterSpacing: '0.3px', whiteSpace: 'nowrap', fontFamily: 'Tajawal, sans-serif' }}>
            MASTER <span style={{ color: '#00b5a3' }}>Y</span>
          </span>
          <span style={{ fontSize: size * 0.22, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: 'Tajawal, sans-serif', whiteSpace: 'nowrap' }}>
            Cutting System
          </span>
        </div>
      )}
    </div>
  );
}
