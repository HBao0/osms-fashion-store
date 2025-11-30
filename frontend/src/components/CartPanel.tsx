import React from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface CartPanelProps {
    onNavigateToCheckout: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};


export const CartPanel: React.FC<CartPanelProps> = ({ onNavigateToCheckout }) => {
    const { 
        isCartOpen, toggleCart, cartItems, updateCartQuantity, removeFromCart, 
        subtotal, discount, total, voucherCode, setVoucherCode, applyVoucher, 
        removeVoucher, appliedVoucher, isApplyingVoucher 
    } = useCart();
    const { currentUser } = useAuth();
    
    if (!isCartOpen) return null;

    const handleCheckout = () => {
        toggleCart(false);
        onNavigateToCheckout();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" onClick={() => toggleCart(false)}>
            <div className="w-full max-w-md bg-secondary h-full flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-secondary-light flex justify-between items-center">
                    <h2 className="text-xl font-bold">Giỏ hàng của bạn</h2>
                    <button onClick={() => toggleCart(false)} className="text-text-light hover:text-primary">&times;</button>
                </div>

                {cartItems.length === 0 ? (
                    <div className="flex-grow flex items-center justify-center">
                        <p className="text-text-light">Giỏ hàng của bạn đang trống.</p>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex items-center space-x-4">
                                <img src={item.images[0]} alt={item.name} className="w-20 h-20 object-cover rounded"/>
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-text-light">{formatCurrency(item.finalPrice)}</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                        <button onClick={() => updateCartQuantity(item.id, item.quantity - 1)} className="px-2 border border-secondary-light rounded">-</button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => updateCartQuantity(item.id, item.quantity + 1)} className="px-2 border border-secondary-light rounded">+</button>
                                    </div>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-400">&times;</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-4 border-t border-secondary-light space-y-4">
                     <div>
                        <div className="flex">
                            <input 
                                type="text" 
                                placeholder="Nhập mã giảm giá"
                                className="flex-grow p-2 bg-background border border-secondary-light rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
                                value={voucherCode}
                                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                disabled={!!appliedVoucher}
                            />
                            <button 
                                onClick={applyVoucher}
                                className="bg-primary text-secondary font-semibold px-4 rounded-r-md hover:bg-primary-dark disabled:bg-gray-500"
                                disabled={isApplyingVoucher || !!appliedVoucher || cartItems.length === 0}
                            >
                                {isApplyingVoucher ? '...' : 'Áp dụng'}
                            </button>
                        </div>
                        {appliedVoucher && (
                            <div className="mt-2 text-sm text-green-400 flex justify-between items-center">
                                <span>✓ {appliedVoucher.description}</span>
                                <button onClick={removeVoucher} className="text-red-400 text-xs">[Xóa]</button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-text-light">Tạm tính:</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-green-400">
                             <span className="text-text-light">Giảm giá:</span>
                            <span>-{formatCurrency(discount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl">
                            <span>Tổng cộng:</span>
                            <span className="text-primary">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <button 
                        onClick={handleCheckout} 
                        disabled={cartItems.length === 0}
                        className="w-full bg-primary text-secondary font-bold py-3 rounded hover:bg-primary-dark transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {currentUser ? 'Tiến hành thanh toán' : 'Đăng nhập để thanh toán'}
                    </button>
                </div>
            </div>
        </div>
    );
};
