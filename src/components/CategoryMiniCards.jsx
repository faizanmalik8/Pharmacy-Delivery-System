import React from 'react';
import { Pill, Activity, Heart, Sparkles, Thermometer, Droplets } from 'lucide-react';

const icons = [Pill, Activity, Heart, Sparkles, Thermometer, Droplets];

export default function CategoryMiniCards({ categories, onSelectCategory }) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-800 font-extrabold font-heading text-lg">
        <Activity size={18} className="text-emerald-600 shrink-0" />
        <h3>Medicine Categories</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {categories.map((cat, index) => {
          const IconComponent = icons[index % icons.length];
          return (
            <button
              key={cat.categoryId}
              onClick={() => onSelectCategory(cat.categoryName)}
              className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                <IconComponent size={24} />
              </div>
              <span className="text-sm font-bold text-slate-700 text-center leading-tight group-hover:text-emerald-800">
                {cat.categoryName}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 mt-1">
                {cat.medicines?.length || 0} items
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
