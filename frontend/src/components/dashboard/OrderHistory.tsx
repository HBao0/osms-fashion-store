import React from 'react';
import { Order } from '../../types';

interface OrderHistoryProps {
    orders: Order[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Lịch sử đơn hàng</h2>
            {orders.length === 0 ? (
                <p>Bạn chưa có đơn hàng nào.</p>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-secondary-light p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold">Đơn hàng #{order.id}</h3>
                                <span className="text-sm px-2 py-1 bg-primary text-secondary rounded-full">{order.status}</span>
                            </div>
                            <p className="text-sm text-text-light">Ngày đặt: {new Date(order.date).toLocaleDateString('vi-VN')}</p>
                            <p className="font-semibold mt-2">Tổng tiền: {formatCurrency(order.total)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
