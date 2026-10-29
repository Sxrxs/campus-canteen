import React, { useState } from 'react';
import { Clock, Plus, Minus, Check, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';
import type { MenuItem } from '../types/canteen.ts';
import { useCart } from '../context/CartContext.tsx';

interface MenuCardProps {
  item: MenuItem;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const [customization, setCustomization] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const cartItem = cart.find((ci) => ci.menuItem.id === item.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const isAvailable = item.isAvailable && item.stockQuantity > 0;

  const handleAdd = () => {
    if (!isAvailable) return;
    addToCart(item, 1, customization);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 900);
    setShowCustomModal(false);
  };

  const isVeg = item.dietaryLabels.includes('veg');
  const isNonVeg = item.dietaryLabels.includes('non-veg');

  return (
    <div className={`group flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 ${
      !isAvailable ? 'opacity-70 grayscale-[30%]' : ''
    }`}>
      {/* Image Container with Badges */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        <img
          src={item.imageUrl}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Dietary symbol badge (Standard Indian FSSAI Veg / Non-Veg dot) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <div className="bg-white/95 backdrop-blur-xs p-1 rounded-md shadow-xs">
            {isVeg ? (
              <div className="w-4 h-4 border-2 border-emerald-600 rounded-sm flex items-center justify-center p-0.5" title="Vegetarian">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
              </div>
            ) : isNonVeg ? (
              <div className="w-4 h-4 border-2 border-red-600 rounded-sm flex items-center justify-center p-0.5" title="Non-Vegetarian">
                <div className="w-2 h-2 rounded-full bg-red-600" />
              </div>
            ) : (
              <div className="w-4 h-4 border-2 border-amber-600 rounded-sm flex items-center justify-center p-0.5" title="Special">
                <div className="w-2 h-2 rounded-full bg-amber-600" />
              </div>
            )}
          </div>

          {item.isSpecialToday && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Today's Special
            </span>
          )}
        </div>

        {/* Prep Time Badge */}
        <div className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
          <Clock className="w-3 h-3 text-orange-400" />
          <span>{item.preparationTimeMinutes}m prep</span>
        </div>

        {/* Availability Overlay if sold out */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center p-3 text-center">
            <span className="px-3 py-1 bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-lg">
              Sold Out / Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Item Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors">
              {item.name}
            </h3>
            <span className="text-base font-black text-slate-900 shrink-0">
              ₹{item.price}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>

          {/* Allergens & Stock warning */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {item.allergenInformation && (
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm line-clamp-1" title={item.allergenInformation}>
                {item.allergenInformation}
              </span>
            )}
            {isAvailable && item.stockQuantity <= 5 && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Only {item.stockQuantity} left
              </span>
            )}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Customization Toggle */}
          <button
            onClick={() => setShowCustomModal(true)}
            className="text-[11px] font-medium text-slate-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
            title="Add cooking instructions (spicy level, no onion, etc.)"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>

          {/* Quantity Controls / Add to Cart */}
          {quantityInCart > 0 ? (
            <div className="flex items-center gap-2 bg-pink-50 border border-pink-200 rounded-xl p-1">
              <button
                onClick={() => updateQuantity(item.id, -1)}
                className="w-7 h-7 rounded-lg bg-white text-pink-700 font-bold flex items-center justify-center hover:bg-pink-100 transition-colors shadow-xs"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-extrabold text-sm text-pink-950 px-1">
                {quantityInCart}
              </span>
              <button
                onClick={() => updateQuantity(item.id, 1)}
                disabled={item.stockQuantity !== undefined && quantityInCart >= item.stockQuantity}
                className="w-7 h-7 rounded-lg bg-pink-600 text-white font-bold flex items-center justify-center hover:bg-pink-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={!isAvailable}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : isAvailable
                  ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-xs hover:shadow-md hover:shadow-pink-600/20 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Add to Cart
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Quick Customization Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
            <h4 className="font-bold text-slate-900 text-sm">Special Instructions for {item.name}</h4>
            <p className="text-xs text-slate-500 mt-1">Specify spices, allergies, or sauce preferences.</p>
            <textarea
              value={customization}
              onChange={(e) => setCustomization(e.target.value)}
              placeholder="e.g., Less spicy, no onions, extra chutney..."
              className="w-full mt-3 p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-orange-500 h-20 resize-none"
              maxLength={120}
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-1.5 text-xs font-bold bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-xs"
              >
                Save & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
