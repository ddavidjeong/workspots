'use client';

import { City, SpotFilters, CITY_DEFAULTS } from '@/types';

interface FloatingFiltersProps {
  city: City;
  filters: SpotFilters;
  onCityChange: (city: City) => void;
  onFiltersChange: (filters: SpotFilters) => void;
}

export default function FloatingFilters({
  city,
  filters,
  onCityChange,
  onFiltersChange,
}: FloatingFiltersProps) {
  const updateFilter = <K extends keyof SpotFilters>(key: K, value: SpotFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const cities = Object.entries(CITY_DEFAULTS) as [City, typeof CITY_DEFAULTS[City]][];

  return (
    <div className="flex flex-wrap gap-2">
      {/* City selector */}
      <div className="flex items-center bg-white rounded-full shadow-md border border-gray-100 p-0.5">
        {cities.map(([key, config]) => (
          <button
            key={key}
            onClick={() => onCityChange(key)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              city === key
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <FilterPill
        icon={
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v10M18.4 6.6a9 9 0 1 1-12.77.04" />
          </svg>
        }
        label="Outlets"
        active={filters.minOutlets === 4}
        onClick={() => updateFilter('minOutlets', filters.minOutlets === 4 ? undefined : 4)}
      />
      <FilterPill
        icon={
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          </svg>
        }
        label="Quiet"
        active={filters.maxNoise === 2}
        onClick={() => updateFilter('maxNoise', filters.maxNoise === 2 ? undefined : 2)}
      />
      <FilterPill
        icon={
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="currentColor" />
          </svg>
        }
        label="WiFi"
        active={filters.minWifi === 4}
        onClick={() => updateFilter('minWifi', filters.minWifi === 4 ? undefined : 4)}
      />
      <FilterPill
        icon={
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
          </svg>
        }
        label="Space"
        active={filters.minTableSpace === 4}
        onClick={() => updateFilter('minTableSpace', filters.minTableSpace === 4 ? undefined : 4)}
      />

      {/* Clear filters */}
      {Object.values(filters).some((v) => v !== undefined) && (
        <button
          onClick={() => onFiltersChange({})}
          className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-600 transition-colors shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}

interface FilterPillProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ icon, label, active, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm border ${
        active
          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
          : 'bg-white border-gray-100 text-gray-600 hover:border-gray-300 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
