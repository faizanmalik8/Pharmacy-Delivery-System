import React, { useState, useRef } from 'react';
import { X, Upload, Camera, FileImage, Send, Info } from 'lucide-react';
import CryptoJS from 'crypto-js';

export default function PrescriptionModal({ isOpen, onClose, ownerWhatsapp }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [note, setNote] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  const fileInputRef = useRef(null);

  const generateSignature = (timestamp, apiSecret) => {
    const str = `timestamp=${timestamp}${apiSecret}`;
    return CryptoJS.SHA1(str).toString();
  };

  if (!isOpen) return null;

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!imagePreview) {
      alert('Please upload or capture a prescription image first.');
      return;
    }
    
    if (!customerName || !customerPhone || !customerAddress) {
      alert('Please fill out all required customer information.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const cloudName = import.meta.env.VITE_CLOUD_NAME;
      const apiKey = import.meta.env.VITE_API_KEY;
      const apiSecret = import.meta.env.VITE_SECRET_KEY;

      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = generateSignature(timestamp, apiSecret);

      const formData = new FormData();
      formData.append('file', imagePreview);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const imageUrl = data.secure_url;

      let message = `🟢 *PHARMADIRECT - PRESCRIPTION UPLOAD*\n`;
      message += `----------------------------------------\n`;
      message += `👤 *Customer Information:*\n`;
      message += `*Name:* ${customerName}\n`;
      message += `*Phone:* ${customerPhone}\n`;
      message += `*Address:* ${customerAddress}\n`;
      if (note) {
        message += `*Instructions:* ${note}\n`;
      }
      message += `\n*Prescription Image:*\n${imageUrl}\n`;
      message += `----------------------------------------\n`;
      message += `🚀 _Sent via PharmaDirect Quick Upload_`;

      const encodedMessage = encodeURIComponent(message);
      const cleanPhone = ownerWhatsapp.replace(/\+/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      window.open(whatsappUrl, '_blank');
      onClose();
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileImage size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-slate-800">Upload Prescription</h3>
              <p className="text-[10px] text-slate-500 font-medium">Send directly via WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Image Upload Area */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Prescription Photo
            </label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                <img src={imagePreview} alt="Prescription Preview" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => setImagePreview(null)}
                    className="px-4 py-2 bg-white text-rose-600 font-bold text-xs rounded-lg shadow-md"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl text-slate-500 hover:text-emerald-600 transition-all cursor-pointer"
                >
                  <Upload size={24} />
                  <span className="text-xs font-bold">Gallery</span>
                </button>
                <label className="flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 rounded-xl text-slate-500 hover:text-emerald-600 transition-all cursor-pointer">
                  <Camera size={24} />
                  <span className="text-xs font-bold">Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageCapture}
                  />
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageCapture}
                />
              </div>
            )}
          </div>

          {/* Delivery Details Form */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
              Delivery Details
            </h4>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. +923001234567"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Delivery Address *</label>
              <textarea
                required
                rows={2}
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Street number, house/apartment, block or sector"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Special Instructions (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Call before arrival"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-all"
              />
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-2">
            <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
              Your prescription image will be securely uploaded to our servers and the link will be attached automatically to your WhatsApp message.
            </p>
          </div>
          
          {uploadError && (
            <p className="text-xs text-rose-600 font-bold text-center">{uploadError}</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={handleSend}
            disabled={!imagePreview || isUploading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all shadow-md ${
              !imagePreview || isUploading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10 hover:shadow-emerald-600/20'
            }`}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send size={16} />
                Open WhatsApp & Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
