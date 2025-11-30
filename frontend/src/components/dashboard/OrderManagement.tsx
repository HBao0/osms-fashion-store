import React from 'react';
import { Order } from '../../types';

interface OrderManagementProps {
    orders: Order[];
    onUpdateStatus: (orderId: string, status: Order['status']) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const OrderManagement: React.FC<OrderManagementProps> = ({ orders, onUpdateStatus }) => {
    const statusOptions: Order['status'][] = ['Đang xử lý', 'Đang giao hàng', 'Đã giao', 'Đã hủy', 'Chờ thanh toán'];
    const [query, setQuery] = React.useState('');

    const filteredOrders = orders.filter(o => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return o.id.toLowerCase().includes(q) || o.shippingInfo.name.toLowerCase().includes(q) || (o.userEmail || '').toLowerCase().includes(q);
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Quản lý đơn hàng</h2>
                <div className="ml-4 flex-1 max-w-lg">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm kiếm mã đơn, khách hàng, email..." className="w-full p-2 bg-background border border-border rounded" />
                </div>
            </div>
             <div className="bg-background rounded-lg shadow overflow-hidden border border-border">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                         <thead className="bg-secondary-light">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Mã ĐH</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Khách hàng</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Ngày đặt</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="bg-secondary divide-y divide-border">
                            {filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-primary">{order.id}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">{order.shippingInfo.name}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">{new Date(order.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">{formatCurrency(order.total)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <select
                                            value={order.status}
                                            onChange={(e) => onUpdateStatus(order.id, e.target.value as Order['status'])}
                                            className="bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            {statusOptions.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderManagement;
