import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import PhoneInput from '../components/PhoneInput';

type PaymentMethod = 'COD' | 'Online';

interface CheckoutProps {
    onPlaceOrder: (order: Omit<Order, 'id' | 'date' | 'status' | 'userEmail'>, paymentMethod: PaymentMethod) => Promise<void>;
    onBack: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const Checkout: React.FC<CheckoutProps> = ({ onPlaceOrder, onBack }) => {
    const { cartItems, subtotal, discount, total, appliedVoucher } = useCart();
    const { currentUser } = useAuth();
    const [shippingInfo, setShippingInfo] = useState({
        name: currentUser?.name || '',
        phone: currentUser?.phone || '',
        address: '',
        city: '',
        district: '',
        ward: '',
        note: ''
    });
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
    const [paymentProvider, setPaymentProvider] = useState<'momo' | 'vnpay' | 'card'>('momo');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setShippingInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        // Client-side validation to surface issues early
        if (!cartItems || cartItems.length === 0) {
            // No items in cart
            alert('Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.');
            return;
        }
        if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
            alert('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.');
            return;
        }

        const orderDetails: Omit<Order, 'id' | 'date' | 'status' | 'userEmail'> & { paymentProvider?: string } = {
            items: cartItems,
            subtotal,
            discount,
            total,
            shippingInfo,
            voucherCode: appliedVoucher?.code,
            paymentMethod: paymentMethod,
            paymentProvider: paymentMethod === 'Online' ? paymentProvider : undefined,
        };

        try {
            setIsSubmitting(true);
            await onPlaceOrder(orderDetails, paymentMethod);
        } catch (error) {
            // parent should show toast; keep minimal handling here
            console.error('Place order failed', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
                <h2 className="text-2xl font-bold mb-6">Thông tin giao hàng & Thanh toán</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Shipping Info Inputs */}
                    <input type="text" name="name" value={shippingInfo.name} onChange={handleInputChange} placeholder="Họ và tên" className="w-full p-2 bg-secondary-light rounded" required />
                    <PhoneInput name="phone" value={shippingInfo.phone} onChange={(v) => setShippingInfo(prev => ({ ...prev, phone: v }))} placeholder="Nhập số điện thoại" required className="w-full" />
                    <input type="text" name="address" value={shippingInfo.address} onChange={handleInputChange} placeholder="Địa chỉ (Số nhà, tên đường)" className="w-full p-2 bg-secondary-light rounded" required />
                    <input type="text" name="city" value={shippingInfo.city} onChange={handleInputChange} placeholder="Tỉnh / Thành phố" className="w-full p-2 bg-secondary-light rounded" required />
                    <input type="text" name="district" value={shippingInfo.district} onChange={handleInputChange} placeholder="Quận / Huyện" className="w-full p-2 bg-secondary-light rounded" required />
                    <input type="text" name="ward" value={shippingInfo.ward} onChange={handleInputChange} placeholder="Phường / Xã" className="w-full p-2 bg-secondary-light rounded" required />
                    <textarea name="note" value={shippingInfo.note} onChange={handleInputChange} placeholder="Ghi chú (tùy chọn)" className="w-full p-2 bg-secondary-light rounded" rows={3}></textarea>
                    
                    {/* Payment Method Selection */}
                    <div className="pt-4">
                        <h3 className="text-lg font-semibold mb-3">Phương thức thanh toán</h3>
                        <div className="space-y-3">
                            <label className={`flex items-center p-3 rounded border transition-all ${paymentMethod === 'COD' ? 'border-primary bg-secondary-light' : 'border-secondary-light'}`}>
                                <input type="radio" name="paymentMethod" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="mr-3"/>
                                <span>Thanh toán khi nhận hàng (COD)</span>
                            </label>
                            <label className={`flex items-center p-3 rounded border transition-all ${paymentMethod === 'Online' ? 'border-primary bg-secondary-light' : 'border-secondary-light'}`}>
                                <input type="radio" name="paymentMethod" value="Online" checked={paymentMethod === 'Online'} onChange={() => setPaymentMethod('Online')} className="mr-3"/>
                                <span>Thanh toán Online (Momo, VNPay, Thẻ)</span>
                            </label>
                        </div>
                    </div>

                    {paymentMethod === 'Online' && (
                        <div className="mt-3">
                            <label className="block text-sm font-medium text-text-light mb-2">Chọn cổng thanh toán</label>
                            <div className="flex gap-3">
                                <label className={`px-3 py-2 rounded border ${paymentProvider === 'momo' ? 'border-primary bg-secondary-light' : 'border-secondary-light'}`}>
                                    <input type="radio" name="provider" value="momo" checked={paymentProvider === 'momo'} onChange={() => setPaymentProvider('momo')} className="mr-2" /> Momo
                                </label>
                                <label className={`px-3 py-2 rounded border ${paymentProvider === 'vnpay' ? 'border-primary bg-secondary-light' : 'border-secondary-light'}`}>
                                    <input type="radio" name="provider" value="vnpay" checked={paymentProvider === 'vnpay'} onChange={() => setPaymentProvider('vnpay')} className="mr-2" /> VNPay
                                </label>
                                <label className={`px-3 py-2 rounded border ${paymentProvider === 'card' ? 'border-primary bg-secondary-light' : 'border-secondary-light'}`}>
                                    <input type="radio" name="provider" value="card" checked={paymentProvider === 'card'} onChange={() => setPaymentProvider('card')} className="mr-2" /> Thẻ
                                </label>
                            </div>
                        </div>
                    )}

                     <div className="flex items-center justify-between mt-8">
                        <button type="button" onClick={onBack} className="text-primary hover:underline">&larr; Quay lại cửa hàng</button>
                        <button type="submit" disabled={isSubmitting} className="bg-primary text-secondary font-bold py-3 px-6 rounded hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Đang xử lý...' : (paymentMethod === 'COD' ? 'Hoàn tất đơn hàng' : 'Tiếp tục thanh toán')}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-secondary p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-6">Đơn hàng của bạn</h2>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                    {cartItems.map(item => (
                        <div key={item.id} className="flex justify-between items-start">
                           <div className="flex items-start space-x-3">
                               <img src={item.images[0]} alt={item.name} className="w-16 h-16 object-cover rounded"/>
                               <div>
                                   <p className="font-semibold leading-tight">{item.name}</p>
                                   <p className="text-sm text-text-light">SL: {item.quantity}</p>
                               </div>
                           </div>
                           <p className="text-text-light">{formatCurrency(item.finalPrice * item.quantity)}</p>
                        </div>
                    ))}
                </div>
                <div className="border-t border-secondary-light mt-6 pt-6 space-y-2">
                     <div className="flex justify-between text-text-light">
                        <span>Tạm tính</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-text-light">
                        <span>Giảm giá</span>
                        <span>-{formatCurrency(discount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl">
                        <span>Tổng cộng</span>
                        <span className="text-primary">{formatCurrency(total)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};