'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
}

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void;
  darkMode?: boolean;
}

export default function SearchBar({ onLocationSelect, darkMode = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const justSelectedRef = useRef(false);

  // Search using Nominatim (OpenStreetMap)
  const searchLocation = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WorkHub/1.0',
          },
        }
      );
      const data = await response.json();
      setResults(data);
      setIsOpen(data.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Skip search if we just selected a result
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchLocation(query);
      }, 150);
    } else {
      setResults([]);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const name = formatResultName(result);

    justSelectedRef.current = true;
    setQuery(name);
    setResults([]);
    setIsOpen(false);
    setIsFocused(false);
    inputRef.current?.blur();
    onLocationSelect(lat, lng, name);
  };

  const formatResultName = (result: SearchResult) => {
    const parts = result.display_name.split(', ');
    // Return first 2-3 parts for cleaner display
    return parts.slice(0, 3).join(', ');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'city':
      case 'town':
      case 'village':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'neighbourhood':
      case 'suburb':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <motion.div
        className={`flex items-center h-9 rounded-full shadow-md overflow-hidden backdrop-blur-sm ${
          darkMode
            ? 'bg-stone-800/95 border border-stone-700'
            : 'bg-white/95 border border-stone-200'
        }`}
        animate={{
          width: query.length > 20 ? 360 : query.length > 10 ? 300 : isFocused ? 260 : 180
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className={`pl-3 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          {isLoading ? (
            <motion.div
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search location..."
          className={`flex-1 h-full px-3 text-sm bg-transparent outline-none ${
            darkMode
              ? 'text-stone-200 placeholder-stone-500'
              : 'text-stone-800 placeholder-stone-400'
          }`}
        />
        {query && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className={`pr-3 ${darkMode ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </motion.div>

      {/* Results dropdown */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`absolute top-11 left-0 w-[420px] rounded-xl shadow-lg overflow-hidden z-50 ${
              darkMode
                ? 'bg-stone-800 border border-stone-700'
                : 'bg-white border border-stone-200'
            }`}
          >
            {results.map((result, index) => (
              <motion.button
                key={`${result.lat}-${result.lon}`}
                onClick={() => handleSelect(result)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  darkMode
                    ? 'hover:bg-stone-700 text-stone-200'
                    : 'hover:bg-stone-50 text-stone-800'
                } ${index !== results.length - 1 ? (darkMode ? 'border-b border-stone-700' : 'border-b border-stone-100') : ''}`}
                whileHover={{ x: 2 }}
              >
                <span className={darkMode ? 'text-stone-500' : 'text-stone-400'}>
                  {getResultIcon(result.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {formatResultName(result)}
                  </p>
                  <p className={`text-xs truncate ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                    {result.display_name}
                  </p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
