import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, MenuItem, PickupSlot } from '../types/canteen.ts';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, customization?: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  selectedSlot: PickupSlot | null;
  setSelectedSlot: (slot: PickupSlot | null) => void;
  specialInstructions: string;
  setSpecialInstructions: (note: string) => void;
  subtotal: number;
  taxAmount: number;
  feeAmount: number;
  totalAmount: number;
  totalItemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  hasUnavailableItems: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cb_student_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedSlot, setSelectedSlot] = useState<PickupSlot | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('cb_student_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: MenuItem, quantity = 1, customization = '') => {
    if (!item.isAvailable || item.stockQuantity <= 0) return;

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.menuItem.id === item.id && (ci.customization || '') === (customization || '')
      );
      if (existingIdx > -1) {
        const next = [...prev];
        const newQty = next[existingIdx].quantity + quantity;
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: Math.min(newQty, item.stockQuantity || 20),
        };
        return next;
      } else {
        return [...prev, { menuItem: item, quantity, customization }];
      }
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((ci) => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.quantity + delta;
            const max = ci.menuItem.stockQuantity || 20;
            return { ...ci, quantity: Math.min(newQty, max) };
          }
          return ci;
        })
        .filter((ci) => ci.quantity > 0);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItem.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedSlot(null);
    setSpecialInstructions('');
  };

  const subtotal = cart.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST
  const feeAmount = subtotal > 0 ? 5 : 0; // ₹5 packaging/campus green eco-fee
  const totalAmount = subtotal + taxAmount + feeAmount;
  const totalItemCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  const hasUnavailableItems = cart.some(
    (ci) => !ci.menuItem.isAvailable || (ci.menuItem.stockQuantity !== undefined && ci.menuItem.stockQuantity <= 0)
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        selectedSlot,
        setSelectedSlot,
        specialInstructions,
        setSpecialInstructions,
        subtotal,
        taxAmount,
        feeAmount,
        totalAmount,
        totalItemCount,
        isCartOpen,
        setIsCartOpen,
        hasUnavailableItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
