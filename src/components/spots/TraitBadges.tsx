'use client';

import { SpotTraits, TRAIT_INFO, TraitKey } from '@/types';

// Simple SVG icons for traits
const icons: Record<string, React.FC<{ className?: string }>> = {
  wifi: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  ),
  plug: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v10" />
      <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
    </svg>
  ),
  armchair: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
      <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H7v-2a2 2 0 0 0-4 0Z" />
      <path d="M5 18v2" />
      <path d="M19 18v2" />
    </svg>
  ),
  volume: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  ),
  maximize: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="18" height="18" x="3" y="3" rx="2" />
    </svg>
  ),
  sun: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  coffee: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <path d="M6 2v2" />
      <path d="M10 2v2" />
      <path d="M14 2v2" />
    </svg>
  ),
  dollar: ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

interface TraitBadgeProps {
  traitKey: TraitKey;
  value: number;
  compact?: boolean;
  variant?: 'default' | 'overlay';
}

function TraitBadge({ traitKey, value, compact = false, variant = 'default' }: TraitBadgeProps) {
  const info = TRAIT_INFO[traitKey];
  const Icon = icons[info.icon];

  // Color based on value (green for high, yellow for medium, red for low)
  // For noise, it's inverted (low noise = good)
  const isGood = info.inverted ? value <= 2 : value >= 4;
  const isMedium = info.inverted ? value === 3 : value === 3;

  const colorClass = variant === 'overlay'
    ? 'bg-stone-900/70 backdrop-blur-sm text-white'
    : isGood
      ? 'bg-emerald-100 text-emerald-800'
      : isMedium
        ? 'bg-amber-100 text-amber-800'
        : 'bg-stone-100 text-stone-600';

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${colorClass}`}
        title={`${info.label}: ${value}/5`}
      >
        <Icon className="w-3 h-3" />
        <span className="font-medium">{info.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-md ${colorClass}`}
      title={info.description}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{info.label}</span>
      <span className="text-sm opacity-80">{value}/5</span>
    </div>
  );
}

interface TraitBadgesProps {
  traits: SpotTraits | null;
  compact?: boolean;
  maxShow?: number;
  variant?: 'default' | 'overlay';
}

export default function TraitBadges({
  traits,
  compact = false,
  maxShow = 4,
  variant = 'default',
}: TraitBadgesProps) {
  if (!traits) return null;

  // Prioritize showing the most relevant work traits
  const priorityOrder: TraitKey[] = [
    'wifi_quality',
    'outlet_availability',
    'noise_level',
    'table_space',
    'seating_comfort',
    'natural_light',
    'coffee_quality',
    'price_level',
  ];

  const traitEntries = priorityOrder
    .filter((key) => traits[key] !== null)
    .slice(0, maxShow)
    .map((key) => ({ key, value: traits[key] as number }));

  if (traitEntries.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${compact ? '' : 'gap-2'}`}>
      {traitEntries.map(({ key, value }) => (
        <TraitBadge key={key} traitKey={key} value={value} compact={compact} variant={variant} />
      ))}
    </div>
  );
}
