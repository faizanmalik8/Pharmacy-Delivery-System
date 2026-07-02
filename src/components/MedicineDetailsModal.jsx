import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Check, ShieldAlert, Image as ImageIcon, Info } from 'lucide-react';

export default function MedicineDetailsModal({ isOpen, onClose, medicine, categoryName, cart, onAddToCart }) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Reset variant index when medicine changes
  useEffect(() => {
    setSelectedVariantIndex(0);
  }, [medicine]);

  if (!isOpen || !medicine) return null;

  const selectedVariant = medicine.variants[selectedVariantIndex] || {};
  const isAvailable = selectedVariant.available;
  const isAdded = cart?.some(item => item.medicineId === medicine.medicineId && item.variant.sku === selectedVariant.sku);

  const isPrescriptionRequired = categoryName === 'Antibiotics' || categoryName === 'Neural';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in sm:p-4">
      {/* Click-away backdrop */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slide-up sm:animate-scale-up">
        
        {/* Header Actions */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="p-2 bg-white/80 backdrop-blur-md text-slate-500 hover:text-slate-800 rounded-full shadow-sm hover:shadow transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-6 rounded-t-3xl sm:rounded-3xl">
          {/* Hero Image */}
          <div className="w-full h-64 sm:h-80 bg-slate-100 flex items-center justify-center relative">
            {medicine.imageUrl ? (
              <img 
                src={medicine.imageUrl} 
                alt={medicine.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-300">
                <ImageIcon size={48} />
                <span className="text-xs font-bold uppercase tracking-widest">No Image Available</span>
              </div>
            )}
            
            {/* Gradient overlay for text readability if needed */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-60"></div>
          </div>

          <div className="px-6 py-6 -mt-10 relative z-10 bg-white rounded-t-3xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                {categoryName}
              </span>
              


              <span className={`ml-auto px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isAvailable ? 'bg-emerald-100/60 text-emerald-800' : 'bg-rose-100/60 text-rose-800'
              }`}>
                {isAvailable ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Title & Formula */}
            <div className="mb-6">
              <h2 className="text-3xl font-black font-heading text-slate-800 leading-tight mb-1">
                {medicine.name}
              </h2>
              <p className="text-sm text-slate-500 italic font-medium">
                {medicine.formula}
              </p>
            </div>

            {/* Description */}
            <div className="mb-8 bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-slate-400" />
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description & Uses</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {medicine.description || "No description available for this medicine."}
              </p>
            </div>

            {/* Variant Selection */}
            <div className="space-y-4">

              <div className="grid gap-3">
                {medicine.variants.map((variant, index) => {
                  const isSelected = selectedVariantIndex === index;
                  return (
                    <div 
                      key={variant.sku}
                      onClick={() => setSelectedVariantIndex(index)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm' 
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                      } ${!variant.available ? 'opacity-50 grayscale' : ''}`}
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{variant.strength}</p>
                        <p className="text-xs font-medium text-slate-500">{variant.packaging}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-800 font-heading text-lg">Rs.{variant.price.toFixed(2)}</p>
                        {!variant.available && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Unavailable</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer for Add to Cart */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white shrink-0 rounded-b-3xl">
          <div className="flex items-center justify-between gap-4 max-w-md mx-auto sm:max-w-none">
            <div className="hidden sm:block min-w-[120px]">

              <span className="text-2xl font-black font-heading text-emerald-600 leading-none">
                Rs.{selectedVariant.price ? selectedVariant.price.toFixed(2) : '0.00'}
              </span>
            </div>

            <button
              onClick={handleAdd}
              disabled={!isAvailable || isAdded}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-3 rounded-xl text-sm font-black transition-all shadow-md ${
                !isAvailable
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  : isAdded
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-emerald-600/30'
              }`}
            >
              {isAdded ? (
                <>
                  <Check size={18} className="stroke-[3px]" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  {isAvailable ? 'Add to Cart' : 'Out of Stock'}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
