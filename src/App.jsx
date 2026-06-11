import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import PrescriptionBanner from './components/PrescriptionBanner';
import MedicineCard from './components/MedicineCard';
import CartDrawer from './components/CartDrawer';
import PrescriptionModal from './components/PrescriptionModal';
import MedicineDetailsModal from './components/MedicineDetailsModal';
import catalogData from './data/medicines_catalog_complete.json';
import { Pill, Activity, ShieldCheck, Heart, Sparkles, MessageCircleCode } from 'lucide-react';

export default function App() {
  // Application State
  const [cart, setCart] = useState(() => {
    const localCart = localStorage.getItem('pharmadirect_cart');
    return localCart ? JSON.parse(localCart) : [];
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const ownerWhatsapp = '+923070026748';
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [selectedMedicineForDetails, setSelectedMedicineForDetails] = useState(null);

  // Hardware Back Button Support (History API)
  useEffect(() => {
    const handlePopState = () => {
      setIsCartOpen(false);
      setIsPrescriptionOpen(false);
      setSelectedMedicineForDetails(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const openModalWithHistory = (type, payload = null) => {
    window.history.pushState({ modal: type }, '', `#${type}`);
    if (type === 'cart') setIsCartOpen(true);
    if (type === 'prescription') setIsPrescriptionOpen(true);
    if (type === 'medicine') setSelectedMedicineForDetails(payload);
  };

  const closeModal = (type) => {
    if (window.history.state?.modal === type) {
      window.history.back();
    } else {
      if (type === 'cart') setIsCartOpen(false);
      if (type === 'prescription') setIsPrescriptionOpen(false);
      if (type === 'medicine') setSelectedMedicineForDetails(null);
    }
  };

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('pharmadirect_cart', JSON.stringify(cart));
  }, [cart]);

  // Scroll to catalog when searching
  useEffect(() => {
    if (searchQuery) {
      document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchQuery]);

  // Cart Operations
  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.medicineId === product.medicineId && item.variant.sku === product.variant.sku
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += 1;
        return updatedCart;
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (medicineId, sku, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(medicineId, sku);
      return;
    }
    setCart((prevCart) => 
      prevCart.map((item) => 
        item.medicineId === medicineId && item.variant.sku === sku 
          ? { ...item, quantity: newQty } 
          : item
      )
    );
  };

  const handleRemoveItem = (medicineId, sku) => {
    setCart((prevCart) => 
      prevCart.filter((item) => !(item.medicineId === medicineId && item.variant.sku === sku))
    );
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      setCart([]);
    }
  };

  // Extract Categories List from catalog
  const categoriesList = catalogData.map(c => c.categoryName);

  const filteredCatalog = catalogData.map((category) => {
    // If there is an active search query, ignore selectedCategory and search all
    // If no search query, filter by selectedCategory normally
    if (!searchQuery && selectedCategory && category.categoryName !== selectedCategory) {
      return null;
    }

    // Filter medicines in this category
    const medicines = category.medicines.filter((med) => {
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      const nameMatch = med.name.toLowerCase().includes(query);
      const formulaMatch = med.formula.toLowerCase().includes(query);
      const categoryMatch = category.categoryName.toLowerCase().includes(query);
      
      return nameMatch || formulaMatch || categoryMatch;
    });

    if (medicines.length === 0) return null;

    return {
      ...category,
      medicines
    };
  }).filter(Boolean); // Remove null categories

  const handleUploadClick = () => {
    openModalWithHistory('prescription');
  };

  // Total items in cart
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <Header
        cartCount={cartCount}
        onCartClick={() => openModalWithHistory('cart')}
        onUploadClick={handleUploadClick}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categories={categoriesList}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
        {/* Hero Section */}
        <Hero 
          categories={categoriesList}
          onCategoryClick={(cat) => {
            setSelectedCategory(cat);
            // Scroll to catalog section
            document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Prescription Banner */}
        <PrescriptionBanner onUploadClick={handleUploadClick} />

        {/* Catalog Section */}
        <section id="catalog-section" className="mt-10 scroll-mt-20">
          {/* Header Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-black font-heading text-slate-800 tracking-tight">
                {selectedCategory ? `${selectedCategory}` : 'All Medicines Catalog'}
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {searchQuery ? `Search results for "${searchQuery}"` : 'Browse by category and configure strength & packaging details'}
              </p>
            </div>

            {/* Results Count / Reset */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl">
                {filteredCatalog.reduce((acc, c) => acc + c.medicines.length, 0)} items found
              </span>
              {(selectedCategory || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-extrabold hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Medicines Catalog Rendering */}
          {filteredCatalog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
                <Pill size={24} />
              </div>
              <div>
                <h3 className="text-slate-800 font-bold font-heading text-lg">No medicines found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  We couldn't find any products matching your search criteria. Try checking your spelling or selecting another category.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredCatalog.map((category) => (
                <div key={category.categoryId} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold font-heading text-lg">
                    <Activity size={18} className="text-emerald-600 shrink-0" />
                    <h3>{category.categoryName}</h3>
                  </div>

                  {/* Medicines Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                    {category.medicines.map((medicine) => (
                      <MedicineCard
                        key={medicine.medicineId}
                        medicine={medicine}
                        categoryName={category.categoryName}
                        onAddToCart={handleAddToCart}
                        cart={cart}
                        searchQuery={searchQuery}
                        onCardClick={() => openModalWithHistory('medicine', { medicine, categoryName: category.categoryName })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4 col-span-1 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-500 rounded-lg text-white font-bold font-heading">
                  +
                </div>
                <span className="text-lg font-black font-heading text-white">
                  Pharma<span className="text-emerald-400">Direct</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">
                Your modern, curated digital medicine shop. Order high-quality certified prescription and OTC drugs safely via WhatsApp.
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold text-emerald-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} />
                  Safe & Secure
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles size={14} />
                  100% Certified
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">Service Hours</h4>
              <ul className="text-xs text-slate-400 space-y-2 font-medium">
                <li>Monday – Saturday</li>
                <li className="text-slate-200">8:00 AM – 10:00 PM</li>
                <li>Sunday Support</li>
                <li className="text-slate-200">10:00 AM – 6:00 PM</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3">Support Contacts</h4>
              <ul className="text-xs text-slate-400 space-y-2 font-medium">
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <MessageCircleCode size={12} />
                  WhatsApp Ordering Enabled
                </li>
                <li>Email: support@pharmadirect.com</li>
                <li>Emergency Pharmacist Helpline</li>
                <li className="text-emerald-400 font-bold">+1 (800) PHARMA-DIRECT</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} PharmaDirect Inc. All rights reserved. Designed to facilitate quick ordering.
            </p>
            <div className="flex gap-4 text-[11px] text-slate-500 font-bold">
              <a href="#terms" className="hover:text-slate-400 transition-colors">Terms of Service</a>
              <a href="#privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="#pharmacist" className="hover:text-slate-400 transition-colors">Contact Pharmacist</a>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => closeModal('cart')}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        ownerWhatsapp={ownerWhatsapp}
      />

      {/* Prescription Upload Modal */}
      <PrescriptionModal
        isOpen={isPrescriptionOpen}
        onClose={() => closeModal('prescription')}
        ownerWhatsapp={ownerWhatsapp}
      />

      {/* Medicine Details Modal */}
      <MedicineDetailsModal
        isOpen={!!selectedMedicineForDetails}
        onClose={() => closeModal('medicine')}
        medicine={selectedMedicineForDetails?.medicine}
        categoryName={selectedMedicineForDetails?.categoryName}
        cart={cart}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
