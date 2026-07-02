import React from 'react';
import { ShoppingCart, Settings, Search, Pill, ShieldCheck, FileUp } from 'lucide-react';

export default function Header({ 
  cartCount, 
  onCartClick, 
  onUploadClick,
  onSettingsClick, 
  searchQuery, 
  setSearchQuery,
  categories,
  selectedCategory,
  setSelectedCategory 
}) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => {
            setSelectedCategory(null);
            setSearchQuery('');
          }}>
            <img src="/logo.png" alt="Hafiz+Pharmacy" className="h-10 w-auto object-contain" />
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg relative">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine, formula, or symptom..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0 justify-center">
            {/* Cart Button */}
            <button
              onClick={onCartClick}
              className="relative flex justify-center items-center gap-1.5 px-3 md:px-4 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg md:rounded-xl text-[10px] md:text-sm transition-all border border-emerald-100/50 shadow-sm"
            >
              <ShoppingCart size={14} className="text-emerald-600 md:w-[18px] md:h-[18px]" />
              <span className="hidden md:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-emerald-600 text-[9px] md:text-[10px] font-bold text-white shadow-md animate-scale-up">
                  {cartCount}
                </span>
              )}
            </button>


          </div>
        </div>

        {/* Sub-header Categories navigation */}
        <div className="flex items-center gap-1.5 py-2 overflow-x-auto border-t border-slate-100 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all border ${
              selectedCategory === null
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
