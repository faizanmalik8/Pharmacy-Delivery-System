import React from 'react';
import { Upload, FileText, ArrowRight } from 'lucide-react';

export default function PrescriptionBanner({ onUploadClick }) {
  return (
    <div className="w-full bg-gradient-to-r from-teal-800 to-cyan-950 text-white p-6 rounded-2xl shadow-lg border border-teal-700/30 flex flex-col md:flex-row items-center justify-between gap-6 hover-lift">
      <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
        <div className="p-3.5 bg-teal-500/10 border border-teal-500/25 rounded-xl text-teal-300">
          <FileText size={28} />
        </div>
        <div>
          <h3 className="text-lg font-bold font-heading">Have a Prescription? Upload & Order Fast</h3>
          <p className="text-xs text-teal-200 mt-1 max-w-md font-medium">
            Our pharmacists will verify your prescription, prepare the items, and coordinate delivery via WhatsApp instantly.
          </p>
        </div>
      </div>
      
      <button
        onClick={onUploadClick}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 shrink-0 cursor-pointer"
      >
        <Upload size={16} />
        Upload Now
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
