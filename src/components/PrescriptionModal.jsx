import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, FileImage, Send, Info, Navigation } from 'lucide-react';
import CryptoJS from 'crypto-js';
import configData from '../utils/config.json';

export default function PrescriptionModal({ isOpen, onClose, ownerWhatsapp }) {
  const [imagePreview, setImagePreview] = useState(null);
  const [note, setNote] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // New States for Branch & Delivery
  const [selectedBranchId, setSelectedBranchId] = useState(configData.branches[0].branchId);
  const [orderType, setOrderType] = useState('pickup');
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
  const [userLocation, setUserLocation] = useState(null);
  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState(0);

  const fileInputRef = useRef(null);

  // The dynamic fee is managed by the useEffect below


  const generateSignature = (timestamp, apiSecret) => {
    const str = `timestamp=${timestamp}${apiSecret}`;
    return CryptoJS.SHA1(str).toString();
  };

  // Early return moved to below hooks

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

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error(error);
        setLocationStatus('error');
        alert("Unable to retrieve your location. Please check browser permissions.");
      }
    );
  };

  // Auto-calculate distance and fee whenever branch, location, or order type changes
  useEffect(() => {
    const calculateFee = async () => {
      if (orderType !== 'delivery' || !userLocation) {
        setDynamicDeliveryFee(0);
        return;
      }

      setLocationStatus('loading');
      const branch = configData.branches.find(b => b.branchId === selectedBranchId);
      if (!branch) return;
      
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${branch.coordinates.lng},${branch.coordinates.lat}?overview=false`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
          const distanceMeters = data.routes[0].distance;
          const distanceKm = distanceMeters / 1000;
          const pricePerKm = configData.appConfig.delivery.pricePerKm;
          setDynamicDeliveryFee(Math.ceil(distanceKm * pricePerKm));
          setLocationStatus('success');
          return; // Exit early if API succeeds
        }
      } catch (error) {
        console.error("Routing error:", error);
      }
      
      // Fallback to straight line (Haversine) without extra multiplier
      const R = 6371; // km
      const dLat = (branch.coordinates.lat - userLocation.lat) * Math.PI / 180;
      const dLon = (branch.coordinates.lng - userLocation.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(branch.coordinates.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c; // Removed the * 1.3 penalty
      const pricePerKm = configData.appConfig.delivery.pricePerKm;
      setDynamicDeliveryFee(Math.ceil(distanceKm * pricePerKm));
      setLocationStatus('success');
    };

    calculateFee();
  }, [userLocation, selectedBranchId, orderType]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!imagePreview) {
      alert('Please upload or capture a prescription image first.');
      return;
    }


    if (!customerName || !customerPhone) {
      alert('Please fill out Name and Phone Number.');
      return;
    }

    if (orderType === 'delivery') {
      if (!userLocation) {
        alert("Live location is required for Delivery to calculate distance. Please tap 'Share Current Location'.");
        return;
      }
      if (!customerAddress) {
        alert("Please provide your full delivery address.");
        return;
      }
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
      const branch = configData.branches.find(b => b.branchId === selectedBranchId);

      let message = `🟢 *PHARMADIRECT - PRESCRIPTION UPLOAD*\n`;
      message += `----------------------------------------\n`;
      message += `🏢 *Branch:* ${branch?.branchName}\n`;
      message += `🚚 *Order Type:* ${orderType === 'pickup' ? 'Pick-Up (Self)' : 'Delivery'}\n`;
      message += `----------------------------------------\n`;
      message += `👤 *Customer Information:*\n`;
      message += `*Name:* ${customerName}\n`;
      message += `*Phone:* ${customerPhone}\n`;

      if (orderType === 'delivery') {
        if (customerAddress) message += `*Address:* ${customerAddress}\n`;
        if (userLocation) {
          message += `*Location Pin:* https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}\n`;
        }
      }

      if (note) {
        message += `*Instructions:* ${note}\n`;
      }
      message += `\n*Prescription Image:*\n${imageUrl}\n`;
      message += `----------------------------------------\n`;
      if (orderType === 'delivery') {
        message += `🚚 *Delivery Fee Calculated:* Rs.${dynamicDeliveryFee.toFixed(2)}\n`;
        message += `----------------------------------------\n`;
      }
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

  if (!isOpen) return null;

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

          {/* Branch & Order Type Selection */}
          <div className="space-y-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            {/* Branch Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Select Branch
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                }}
                className="w-full text-sm font-bold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 transition-all shadow-sm"
              >
                {configData.branches.map(b => (
                  <option key={b.branchId} value={b.branchId}>{b.branchName}</option>
                ))}
              </select>
            </div>

            {/* Order Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                Order Type
              </label>
              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" className="peer sr-only" name="modalOrderType" value="pickup" checked={orderType === 'pickup'} onChange={() => setOrderType('pickup')} />
                  <div className="px-3 py-2.5 text-center text-sm font-bold rounded-xl border-2 border-slate-200 bg-white peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700 transition-all shadow-sm">
                    Pick-Up (Free)
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" className="peer sr-only" name="modalOrderType" value="delivery" checked={orderType === 'delivery'} onChange={() => setOrderType('delivery')} />
                  <div className="px-3 py-2.5 text-center text-sm font-bold rounded-xl border-2 border-slate-200 bg-white peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700 transition-all shadow-sm">
                    Delivery
                  </div>
                </label>
              </div>
            </div>
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

            {orderType === 'delivery' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Share Location for Delivery Cost *
                  </label>
                  <button
                    type="button"
                    onClick={handleShareLocation}
                    disabled={locationStatus === 'loading'}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all border ${locationStatus === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                      }`}
                  >
                    <Navigation size={14} />
                    {locationStatus === 'loading' ? 'Calculating...' :
                      locationStatus === 'success' ? 'Location Shared (Fee Calculated)' :
                        'Share Current Location'}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Delivery Address (Optional if location shared)</label>
                  <textarea
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Street number, house/apartment, block or sector"
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-all resize-none"
                  />
                </div>
              </div>
            )}

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
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all shadow-md ${!imagePreview || isUploading
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
