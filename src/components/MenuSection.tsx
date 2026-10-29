import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Sparkles,
  UtensilsCrossed,
  Sunrise,
  Sandwich,
  Cookie,
  Coffee,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import type { Category, MenuItem, CanteenSettings } from '../types/canteen.ts';
import { MenuCard } from './MenuCard.tsx';

interface MenuSectionProps {
  categories: Category[];
  items: MenuItem[];
  settings: CanteenSettings | null;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  categories,
  items,
  settings,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'prep-time'>('popular');

  const categoryIcons: Record<string, React.ReactNode> = {
    cat_combos: <UtensilsCrossed className="w-4 h-4" />,
    cat_breakfast: <Sunrise className="w-4 h-4" />,
    cat_rolls_fastfood: <Sandwich className="w-4 h-4" />,
    cat_snacks: <Cookie className="w-4 h-4" />,
    cat_beverages: <Coffee className="w-4 h-4" />,
  };

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Category filter
        if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
          return false;
        }

        // Dietary filter
        if (dietaryFilter === 'veg' && !item.dietaryLabels.includes('veg')) {
          return false;
        }
        if (dietaryFilter === 'non-veg' && !item.dietaryLabels.includes('non-veg')) {
          return false;
        }

        // Available only
        if (availableOnly && (!item.isAvailable || item.stockQuantity <= 0)) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchAllergens = (item.allergenInformation || '').toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchAllergens) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'prep-time') return a.preparationTimeMinutes - b.preparationTimeMinutes;
        // Default: featured first, then specials
        if (a.isSpecialToday && !b.isSpecialToday) return -1;
        if (!a.isSpecialToday && b.isSpecialToday) return 1;
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [items, selectedCategoryId, dietaryFilter, availableOnly, searchQuery, sortBy]);

  const featuredSpecials = useMemo(() => {
    return items.filter((it) => it.isSpecialToday || it.isFeatured);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner with Estimated Pickup info */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-violet-950 to-pink-950 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-semibold mb-3">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Fast College Ordering System</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Order food in advance. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-violet-300 to-orange-400">
              Pick up without waiting in queues.
            </span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-lg leading-relaxed">
            Choose your meal, reserve a convenient 10-minute pickup slot, pay securely via UPI/Card, and grab your hot order with your collection token.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Average pickup wait: <strong className="text-white">~4 mins</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
              <span>Slots every 15 mins</span>
            </div>
          </div>
        </div>

        {/* Background decorative glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Search, Filter Bar and Sorting */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes (e.g. Dosa, Paneer Roll, Biryani, Coffee...)"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden md:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-orange-500 cursor-pointer"
            >
              <option value="popular">Recommended / Specials</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="prep-time">Prep Time: Fastest</option>
            </select>
          </div>
        </div>

        {/* Dietary and Availability Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dietaryFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Diets
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dietaryFilter === 'veg'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Pure Veg</span>
            </button>
            <button
              onClick={() => setDietaryFilter('non-veg')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dietaryFilter === 'non-veg'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Non-Veg</span>
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
            />
            <span>Available in-stock only</span>
          </label>
        </div>
      </div>

      {/* Category Shortcuts Horizontal Scroller */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
            selectedCategoryId === 'all'
              ? 'bg-pink-600 text-white shadow-pink-600/20'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Full Menu ({items.length})</span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const count = items.filter((i) => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                isSelected
                  ? 'bg-pink-600 text-white shadow-pink-600/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {categoryIcons[cat.id] || <UtensilsCrossed className="w-3.5 h-3.5" />}
              <span>{cat.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Menu Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No food items matched your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search keywords, clearing dietary filters, or exploring all canteen categories.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategoryId('all');
              setDietaryFilter('all');
              setAvailableOnly(false);
            }}
            className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};
