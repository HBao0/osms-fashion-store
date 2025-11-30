import React, { createContext, useState, useContext, useMemo } from 'react';
import { Product, CartItem, AppliedVoucher } from '../types';
import * as api from '../services/api';
import toast from 'react-hot-toast';

interface CartContextType {
    cartItems: CartItem[];
    isCartOpen: boolean;
    addToCart: (product: Product, quantity?: number) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    toggleCart: (isOpen?: boolean) => void;
    cartItemCount: number;
    subtotal: number;
    discount: number;
    total: number;
    voucherCode: string;
    setVoucherCode: (code: string) => void;
    appliedVoucher: AppliedVoucher | null;
    applyVoucher: () => Promise<void>;
    removeVoucher: () => void;
    isApplyingVoucher: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

    const subtotal = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.finalPrice * item.quantity, 0);
    }, [cartItems]);

    const discount = useMemo(() => {
        return appliedVoucher?.discountAmount || 0;
    }, [appliedVoucher]);

    const total = useMemo(() => {
        return subtotal - discount;
    }, [subtotal, discount]);


    const addToCart = (product: Product, quantity: number = 1) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...prevItems, { ...product, quantity }];
        });
        toast.success(`${product.name} đã được thêm vào giỏ hàng.`);
        setIsCartOpen(true);
    };

    const updateCartQuantity = (productId: string, quantity: number) => {
        setCartItems(prevItems => {
            if (quantity <= 0) {
                return prevItems.filter(item => item.id !== productId);
            }
            return prevItems.map(item =>
                item.id === productId ? { ...item, quantity } : item
            );
        });
    };
    
    const removeFromCart = (productId: string) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setCartItems([]);
        removeVoucher();
    };

    const toggleCart = (isOpen?: boolean) => {
        setIsCartOpen(prev => isOpen !== undefined ? isOpen : !prev);
    };

    const cartItemCount = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    }, [cartItems]);

    const applyVoucher = async () => {
        if (!voucherCode) return;
        setIsApplyingVoucher(true);
        try {
            const validatedVoucher = await api.applyVoucher(voucherCode, subtotal);
            let discountAmount = 0;
            if (validatedVoucher.type === 'percent') {
                discountAmount = subtotal * (validatedVoucher.value / 100);
            } else {
                discountAmount = validatedVoucher.value;
            }
            setAppliedVoucher({ ...validatedVoucher, discountAmount });
            toast.success('Áp dụng voucher thành công!');
        } catch (error: any) {
            setAppliedVoucher(null);
            toast.error(error.message || 'Có lỗi xảy ra.');
        } finally {
            setIsApplyingVoucher(false);
        }
    };
    
    const removeVoucher = () => {
        setVoucherCode('');
        setAppliedVoucher(null);
    }

    return (
        <CartContext.Provider value={{ 
            cartItems, isCartOpen, addToCart, updateCartQuantity, removeFromCart, 
            clearCart, toggleCart, cartItemCount, subtotal, discount, total,
            voucherCode, setVoucherCode, appliedVoucher, applyVoucher, removeVoucher, isApplyingVoucher
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
