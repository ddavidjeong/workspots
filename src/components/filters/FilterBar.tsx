'use client';

import { City, SpotFilters, TRAIT_INFO, CITY_DEFAULTS } from '@/types';

interface FilterBarProps {
  city: City;
  filters: SpotFilters;
  onCityChange: (city: City) => void;
  onFiltersChange: (filters: SpotFilters) => void;
}

const NEIGHBORHOODS: Record<City, string[]> = {
  nyc: [
    'Greenwich Village',
    'Chelsea',
    'Flatiron',
    'SoHo',
    'Williamsburg',
    'DUMBO',
    'Lower East Side',
    'East Village',
    'Midtown',
    'Upper West Side',
  ],
  sf: [
    'SoMa',
    'Mission',
    'Hayes Valley',
    'North Beach',
    'Marina',
    'Potrero Hill',
    'Noe Valley',
    'Castro',
    'Financial District',
    'Mid-Market',
  ],
  fortlee: [
    'Main Street',
    'Palisades Park',
    'GWB Area',
  ],
};

export default function FilterBar({
  city,
  filters,
  onCityChange,
  onFiltersChange,
}: FilterBarProps) {
  const updateFilter = <K extends keyof SpotFilters>(key: K, value: SpotFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white overflow-x-auto">
      {/* City Toggle */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1 shrink-0">
        {(Object.entries(CITY_DEFAULTS) as [City, typeof CITY_DEFAULTS[City]][]).map(([key, config]) => (
          <button
            key={key}
            onClick={() => onCityChange(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              city === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-200 shrink-0" />

      {/* Neighborhood Filter */}
      <select
        value={filters.neighborhood || ''}
        onChange={(e) => updateFilter('neighborhood', e.target.value || undefined)}
        className="px-3 py-1.5 bg-gray-100 border-0 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        <option value="">All neighborhoods</option>
        {NEIGHBORHOODS[city].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      {/* Quick Trait Filters */}
      <div className="flex items-center gap-2">
        <FilterChip
          label="Good WiFi"
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <circle cx="12" cy="20" r="1" fill="currentColor" />
            </svg>
          }
          active={filters.minWifi === 4}
          onClick={() => updateFilter('minWifi', filters.minWifi === 4 ? undefined : 4)}
        />
        <FilterChip
          label="Has Outlets"
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v10" />
              <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
            </svg>
          }
          active={filters.minOutlets === 4}
          onClick={() => updateFilter('minOutlets', filters.minOutlets === 4 ? undefined : 4)}
        />
        <FilterChip
          label="Quiet"
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            </svg>
          }
          active={filters.maxNoise === 2}
          onClick={() => updateFilter('maxNoise', filters.maxNoise === 2 ? undefined : 2)}
        />
        <FilterChip
          label="Spacious"
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="3" rx="2" />
            </svg>
          }
          active={filters.minTableSpace === 4}
          onClick={() => updateFilter('minTableSpace', filters.minTableSpace === 4 ? undefined : 4)}
        />
      </div>

      {/* Clear Filters */}
      {Object.values(filters).some((v) => v !== undefined) && (
        <>
          <div className="w-px h-6 bg-gray-200 shrink-0" />
          <button
            onClick={() => onFiltersChange({})}
            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 shrink-0"
          >
            Clear all
          </button>
        </>
      )}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, icon, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
        transition-colors shrink-0
        ${active
          ? 'bg-blue-100 text-blue-700 border border-blue-300'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'}
      `}
    >
      {icon}
      {label}
    </button>
  );
}
