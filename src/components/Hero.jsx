import React from 'react';
import { ShieldAlert, Truck, HeartHandshake, CheckCircle } from 'lucide-react';

export default function Hero({ onCategoryClick, categories }) {
  // Let's get the 4 categories for quick display or show some of them
  const quickCats = categories.slice(0, 4);

  return (
    <section className="relative w-full overflow-hidden bg-slate-900 text-white rounded-3xl my-6">
      {/* Decorative gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-900/90 to-emerald-950/90 z-0"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 z-0"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 z-0"></div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-16 text-center z-10">
        {/* Quality Badges */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-semibold mb-6 animate-fade-in">
          <CheckCircle size={14} />
          100% Certified Pharmacies
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-extrabold font-heading tracking-tight leading-tight max-w-2xl mx-auto">
          Your Trusted Healthcare Partner, <span className="text-emerald-400">Delivered Fast.</span>
        </h1>
        
        {/* Subtext */}
        <p className="mt-4 text-sm md:text-base text-slate-300 max-w-lg mx-auto font-medium leading-relaxed">
          Order genuine medicines, chronic treatments, and health essentials directly through WhatsApp with local delivery support.
        </p>

        {/* Categories Pills Quick Access */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Quick Browse:</span>
          {quickCats.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryClick(cat)}
              className="px-4 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Features Row */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-800">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Truck size={20} />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fast Delivery</h4>
              <p className="text-xs text-slate-300 font-semibold">At your door within 2 hours</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <HeartHandshake size={20} />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">WhatsApp Checkout</h4>
              <p className="text-xs text-slate-300 font-semibold">Direct chat with pharmacists</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <ShieldAlert size={20} />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">100% Genuine</h4>
              <p className="text-xs text-slate-300 font-semibold">Verified medicine catalogs</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
