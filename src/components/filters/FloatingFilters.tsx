'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { City, SpotFilters, CITY_DEFAULTS, CATEGORY_INFO, SpotCategory } from '@/types';

interface FloatingFiltersProps {
  city: City;
  filters: SpotFilters;
  spotCount?: number;
  showCitySelector?: boolean;
  onCityChange: (city: City) => void;
  onFiltersChange: (filters: SpotFilters) => void;
}

export default function FloatingFilters({
  city,
  filters,
  spotCount = 0,
  showCitySelector = true,
  onCityChange,
  onFiltersChange,
}: FloatingFiltersProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);

  const updateFilter = <K extends keyof SpotFilters>(key: K, value: SpotFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const cities = Object.entries(CITY_DEFAULTS) as [City, typeof CITY_DEFAULTS[City]][];
  const categories = Object.entries(CATEGORY_INFO) as [SpotCategory, typeof CATEGORY_INFO[SpotCategory]][];
  const selectedCategory = filters.category ? CATEGORY_INFO[filters.category] : null;

  return (
    <motion.div layout className="flex flex-wrap items-center gap-2">
      {/* City selector - h-9 to match other buttons */}
      {showCitySelector && (
        <div className="flex items-center h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-stone-200 px-1 overflow-hidden">
          {cities.map(([key, config]) => (
            <motion.button
              key={key}
              onClick={() => onCityChange(key)}
              className={`h-7 px-3 rounded-full text-xs font-medium relative ${
                city === key ? 'text-white' : 'text-stone-600 hover:text-stone-900'
              }`}
              whileHover={{ scale: city === key ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {city === key && (
                <motion.div
                  layoutId="cityBg"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: '#283618' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{config.label}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Category dropdown - h-9 */}
      <div className="relative">
        <motion.button
          onClick={() => setCategoryOpen(!categoryOpen)}
          className="flex items-center gap-1.5 h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-stone-200 px-3 text-xs font-medium text-stone-700 cursor-pointer hover:border-stone-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          layout
        >
          <motion.span layout="position" className="flex items-center gap-1.5">
            {selectedCategory && (
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedCategory.marker }}
              />
            )}
            {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.label}` : 'All types'}
          </motion.span>
          <motion.svg
            className="w-3 h-3 text-stone-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: categoryOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </motion.button>

        <AnimatePresence>
          {categoryOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCategoryOpen(false)}
              />
              <motion.div
                className="absolute top-full left-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-stone-200 overflow-hidden z-50 min-w-[140px]"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <motion.button
                  onClick={() => {
                    updateFilter('category', undefined);
                    setCategoryOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                    !filters.category ? 'text-[#283618]' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                  style={{ backgroundColor: !filters.category ? '#fefae0' : 'transparent' }}
                  whileHover={{ x: 2 }}
                >
                  All types
                </motion.button>
                {categories.map(([key, info], i) => (
                  <motion.button
                    key={key}
                    onClick={() => {
                      updateFilter('category', key);
                      setCategoryOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors flex items-center gap-2 ${
                      filters.category === key ? 'bg-stone-100' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    whileHover={{ x: 2 }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: info.marker }}
                    />
                    <span>{info.icon}</span>
                    <span className="flex-1">{info.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Filter pills - all h-9 */}
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

      {/* Clear filters - h-9 */}
      <AnimatePresence mode="popLayout">
        {Object.values(filters).some((v) => v !== undefined) && (
          <motion.button
            layout
            onClick={() => onFiltersChange({})}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium shadow-sm"
            style={{ backgroundColor: '#fefae0', color: '#283618' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05, backgroundColor: '#f5f0d0' }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </motion.button>
        )}
      </AnimatePresence>

      {/* Spot count with flip animation - only show if spotCount provided */}
      {spotCount > 0 && (
        <motion.div
          layout="position"
          className="flex items-center h-9 bg-white/95 backdrop-blur-sm rounded-full shadow-md border border-stone-200 px-3 gap-1"
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        >
          <FlipCounter value={spotCount} /><span className="text-xs font-medium text-stone-500">spots</span>
        </motion.div>
      )}
    </motion.div>
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
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-medium shadow-sm border relative overflow-hidden ${
        active
          ? 'border-[#bc6c25] text-[#283618]'
          : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      layout
    >
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: '#fefae0' }}
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="absolute inset-0 bg-white"
        initial={false}
        animate={{ opacity: active ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      />
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </motion.button>
  );
}

function FlipCounter({ value }: { value: number }) {
  const digits = String(value).split('');

  return (
    <span className="text-xs font-semibold tabular-nums" style={{ letterSpacing: '0.02em', color: '#283618' }}>
      <AnimatePresence mode="popLayout">
        {digits.map((digit, i) => (
          <motion.span
            key={`${digits.length}-${i}-${digit}`}
            className="inline-block"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          >
            {digit}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
