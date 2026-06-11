import React, { useState } from 'react';
import { ShoppingCart, Check, ShieldAlert, Image as ImageIcon } from 'lucide-react';

const HighlightText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-emerald-200 text-emerald-900 font-extrabold px-0.5 rounded-sm">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export default function MedicineCard({ medicine, categoryName, onAddToCart, cart, searchQuery = '', onCardClick }) {
  // Set the first variant as default selected
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const selectedVariant = medicine.variants[selectedVariantIndex] || {};
  const isAvailable = selectedVariant.available;
  const isAdded = cart?.some(item => item.medicineId === medicine.medicineId && item.variant.sku === selectedVariant.sku);

  // Prescription required check: usually for Antibiotics and Neural categories
  const isPrescriptionRequired = 
    categoryName === 'Antibiotics' || 
    categoryName === 'Neural';

  const handleAdd = () => {
    if (!isAvailable) return;
    
    onAddToCart({
      medicineId: medicine.medicineId,
      name: medicine.name,
      formula: medicine.formula,
      category: categoryName,
      variant: selectedVariant
    });
  };

  return (
    <div className="flex flex-col bg-white border border-slate-200/60 rounded-2xl p-5 hover-lift relative justify-between h-full">
      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-2 md:mb-3">
        {/* Category Tag */}
        <span className="px-1.5 md:px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] md:text-[10px] font-bold rounded-full uppercase tracking-wider">
          {categoryName}
        </span>
        
        {/* Prescription Required Badge */}
        {isPrescriptionRequired && (
          <span className="flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[8px] md:text-[10px] font-bold rounded-full uppercase tracking-wider">
            <ShieldAlert className="w-2 h-2 md:w-2.5 md:h-2.5 shrink-0" />
            Rx Req
          </span>
        )}

        {/* Stock Badge */}
        <span className={`ml-auto px-1.5 md:px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-wider ${
          isAvailable 
            ? 'bg-emerald-100/60 text-emerald-800' 
            : 'bg-rose-100/60 text-rose-800'
        }`}>
          {isAvailable ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>

      {/* Image Block */}
      <div 
        onClick={onCardClick}
        className="w-full h-32 bg-slate-50 border border-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer group"
      >
        {medicine.imageUrl ? (
          <img 
            src={medicine.imageUrl} 
            alt={medicine.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300 group-hover:scale-105 transition-transform duration-500">
            <ImageIcon size={28} />
            <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
          </div>
        )}
      </div>

      {/* Main Info */}
      <div className="mb-4 cursor-pointer group" onClick={onCardClick}>
        <h4 className="text-lg font-bold font-heading text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">
          <HighlightText text={medicine.name} highlight={searchQuery} />
        </h4>
        <p className="text-xs text-slate-500 italic mt-0.5 font-medium">
          <HighlightText text={medicine.formula} highlight={searchQuery} />
        </p>
      </div>

      {/* Variant Selector */}
      <div className="mb-5">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Select Strength & Pack:
        </label>
        <select
          value={selectedVariantIndex}
          onChange={(e) => setSelectedVariantIndex(Number(e.target.value))}
          className="w-full text-xs font-semibold py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-all"
        >
          {medicine.variants.map((variant, index) => (
            <option key={variant.sku} value={index}>
              {variant.strength} — {variant.packaging} (Rs.{variant.price.toFixed(2)}) {!variant.available ? '(Unavailable)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Bottom Row: Price and Button */}
      <div className="flex items-center justify-between gap-1 md:gap-4 mt-auto pt-2 md:pt-3 border-t border-slate-100">
        <div className="min-w-0 flex-1">
          <span className="block text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none truncate">
            Price
          </span>
          <span className="text-sm md:text-xl font-black font-heading text-slate-800 truncate block">
            Rs.{selectedVariant.price ? selectedVariant.price.toFixed(2) : '0.00'}
          </span>
        </div>

        <button
          onClick={handleAdd}
          disabled={!isAvailable || isAdded}
          className={`flex items-center justify-center gap-1 md:gap-1.5 px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all shrink-0 ${
            !isAvailable
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/50'
              : isAdded
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10 cursor-default'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-100/50 hover:border-emerald-600 shadow-sm cursor-pointer'
          }`}
        >
          {isAdded ? (
            <>
              <Check size={14} className="stroke-[3px]" />
              Added!
            </>
          ) : (
            <>
              <ShoppingCart size={14} />
              Add
            </>
          )}
        </button>
      </div>
    </div>
  );
}
