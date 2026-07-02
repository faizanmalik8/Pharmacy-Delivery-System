import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, Plus, Minus, Send, MapPin, Navigation } from 'lucide-react';
import configData from '../utils/config.json';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  ownerWhatsapp
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [instructions, setInstructions] = useState('');

  // New States for Branch & Delivery
  const [selectedBranchId, setSelectedBranchId] = useState(configData.branches[0].branchId);
  const [orderType, setOrderType] = useState('pickup');
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, loading, success, error
  const [userLocation, setUserLocation] = useState(null);
  const [dynamicDeliveryFee, setDynamicDeliveryFee] = useState(0);

  const scrollContainerRef = useRef(null);

  // Auto-scroll to prescription section if requested
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      // Small timeout to allow render
      const timer = setTimeout(() => {
        const hash = window.location.hash;
        if (hash === '#prescription-upload') {
          const element = document.getElementById('prescription-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            // Clean hash
            window.location.hash = '';
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // The dynamic fee is managed by the useEffect below


  // Early return moved to below hooks

  // Calculation
  const subtotal = cartItems.reduce((acc, item) => acc + (item.variant.price * item.quantity), 0);
  const deliveryFee = orderType === 'delivery' ? dynamicDeliveryFee : 0.00;
  const grandTotal = subtotal + deliveryFee;

  // Handle Location Sharing
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
      
      // Calculate straight-line GPS distance between device location and branch
      const R = 6371; // Earth's radius in km
      const dLat = (branch.coordinates.lat - userLocation.lat) * Math.PI / 180;
      const dLon = (branch.coordinates.lng - userLocation.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(branch.coordinates.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c; 
      
      const pricePerKm = configData.appConfig.delivery.pricePerKm;
      setDynamicDeliveryFee(Math.ceil(distanceKm * pricePerKm));
      setLocationStatus('success');
    };

    calculateFee();
  }, [userLocation, selectedBranchId, orderType]);



  const handleCheckout = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

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

    const branch = configData.branches.find(b => b.branchId === selectedBranchId);

    // Build curated WhatsApp message
    let message = `🟢 *PHARMADIRECT - NEW ORDER*\n`;
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
    if (instructions) {
      message += `*Instructions:* ${instructions}\n`;
    }

    message += `\n📦 *Order Details:*\n`;
    cartItems.forEach((item, index) => {
      const itemSubtotal = item.variant.price * item.quantity;
      message += `${index + 1}. *${item.name}* (${item.variant.strength} - ${item.variant.packaging})\n`;
      message += `   Formula: _${item.formula}_\n`;
      message += `   Qty: ${item.quantity} x Rs.${item.variant.price.toFixed(2)} | Subtotal: *Rs.${itemSubtotal.toFixed(2)}*\n`;
    });



    message += `----------------------------------------\n`;
    message += `💵 *Payment Summary:*\n`;
    message += `Subtotal: Rs.${subtotal.toFixed(2)}\n`;
    message += `Delivery Fee: Rs.${deliveryFee.toFixed(2)}\n`;
    message += `*Grand Total: Rs.${grandTotal.toFixed(2)}*\n`;
    message += `----------------------------------------\n`;
    message += `🚀 _Order sent via PharmaDirect Quick Checkout_`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Clean target WhatsApp phone number
    const cleanPhone = ownerWhatsapp.replace(/\+/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    onClearCart();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      />

      {/* Cart Slider Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in border-l border-slate-100">

        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-heading text-slate-800">Shopping Cart</h3>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
              {cartItems.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin"
        >
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
                <Minus size={24} />
              </div>
              <div>
                <h4 className="text-slate-700 font-bold font-heading">Your cart is empty</h4>
                <p className="text-xs text-slate-500 max-w-[240px] mx-auto mt-1">
                  Add medicines from the catalog to build your prescription or order list.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Branch & Order Type Selection at Top */}
              <div className="space-y-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl mb-4">
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
                      <input type="radio" className="peer sr-only" name="orderType" value="pickup" checked={orderType === 'pickup'} onChange={() => setOrderType('pickup')} />
                      <div className="px-3 py-2.5 text-center text-sm font-bold rounded-xl border-2 border-slate-200 bg-white peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700 transition-all shadow-sm">
                        Pick-Up (Free)
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" className="peer sr-only" name="orderType" value="delivery" checked={orderType === 'delivery'} onChange={() => setOrderType('delivery')} />
                      <div className="px-3 py-2.5 text-center text-sm font-bold rounded-xl border-2 border-slate-200 bg-white peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700 transition-all shadow-sm">
                        Delivery
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Items Selected</h4>
                  <button
                    onClick={onClearCart}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2.5">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.medicineId}-${item.variant.sku}`}
                      className="flex gap-3 p-3 bg-slate-50 border border-slate-200/50 rounded-xl animate-scale-up"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h5 className="text-sm font-bold text-slate-800 truncate leading-snug">
                            {item.name}
                          </h5>
                          <button
                            onClick={() => onRemoveItem(item.medicineId, item.variant.sku)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 italic truncate -mt-0.5">{item.formula}</p>
                        <p className="text-[11px] text-slate-500 font-semibold mt-1">
                          {item.variant.strength} • {item.variant.packaging}
                        </p>
                        <p className="text-xs font-black text-slate-800 mt-0.5">
                          Rs.{(item.variant.price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex flex-col items-center justify-between bg-white border border-slate-200 rounded-lg py-1 px-1.5 shrink-0">
                        <button
                          onClick={() => onUpdateQuantity(item.medicineId, item.variant.sku, item.quantity + 1)}
                          className="p-0.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded"
                        >
                          <Plus size={12} />
                        </button>
                        <span className="text-xs font-black text-slate-700 min-w-[16px] text-center my-0.5">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.medicineId, item.variant.sku, item.quantity - 1)}
                          className="p-0.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>



              {/* Delivery Details Form */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                  Delivery Details
                </h4>

                <form onSubmit={handleCheckout} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Full Name *
                    </label>
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
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Phone Number *
                    </label>
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
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Full Delivery Address (Optional if location shared)
                        </label>
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
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="e.g. Call before arrival, leave at gate"
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 transition-all"
                    />
                  </div>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Footer Billing Details & Checkout */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 shrink-0 space-y-4 shadow-inner">
            <div className="space-y-1.5 text-xs text-slate-600 font-semibold">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs.{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>Rs.{deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-800 pt-1.5 border-t border-slate-200/60">
                <span>Grand Total</span>
                <span className="text-emerald-700">Rs.{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all cursor-pointer shadow-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10 hover:shadow-emerald-600/20"
            >
              <Send size={16} />
              Confirm Order via WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
