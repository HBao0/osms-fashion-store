import React, { useState } from 'react';
import { Order } from '../types';

interface MockPaymentProps {
    order: Order;
    onSuccess: () => void;
    onCancel: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const MockPayment: React.FC<MockPaymentProps> = ({ order, onSuccess, onCancel }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSuccess = () => {
        setIsProcessing(true);
        // Simulate network delay
        setTimeout(() => {
            onSuccess();
            setIsProcessing(false);
        }, 1500);
    };
    
    const handleCancel = () => {
        setIsProcessing(true);
        setTimeout(() => {
            onCancel();
            setIsProcessing(false);
        }, 500);
    };

    return (
        <div className="max-w-md mx-auto bg-secondary p-8 rounded-lg shadow-lg text-center">
            <h1 className="text-2xl font-bold mb-2">Cổng thanh toán OSMS Mock</h1>
            <p className="text-text-light mb-6">Đây là một giao diện thanh toán giả lập. Cổng: <strong className="text-primary">{order.paymentProvider || 'Unknown'}</strong></p>
            
            <div className="text-left bg-background p-4 rounded mb-6">
                <p className="flex justify-between"><span>Mã đơn hàng:</span> <strong>{order.id}</strong></p>
                <p className="flex justify-between mt-2"><span>Tổng số tiền:</span> <strong className="text-primary text-xl">{formatCurrency(order.total)}</strong></p>
            </div>
            
            <p className="mb-4">Vui lòng chọn kết quả thanh toán để mô phỏng cho <strong>{order.paymentProvider || 'cổng'}</strong>:</p>

            <div className="space-y-4">
                 <button 
                    onClick={handleSuccess}
                    disabled={isProcessing}
                    className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded hover:bg-green-700 transition-colors disabled:bg-gray-500"
                >
                    {isProcessing ? 'Đang xử lý...' : 'Thanh toán thành công'}
                </button>
                <button 
                    onClick={handleCancel}
                    disabled={isProcessing}
                    className="w-full bg-red-600 text-white font-bold py-3 px-6 rounded hover:bg-red-700 transition-colors disabled:bg-gray-500"
                >
                    {isProcessing ? 'Đang xử lý...' : 'Hủy thanh toán'}
                </button>
            </div>
        </div>
    );
};

export default MockPayment;