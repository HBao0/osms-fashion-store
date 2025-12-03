import React, { useState, useMemo } from 'react';
import { User, Order, Product, LogEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from '../components/dashboard/UserProfile';
import OrderHistory from '../components/dashboard/OrderHistory';
import ProductManagement from '../components/dashboard/ProductManagement';
import UserManagement from '../components/dashboard/UserManagement';
import OrderManagement from '../components/dashboard/OrderManagement';
import LogViewer from '../components/dashboard/LogViewer';
import Analytics from './Analytics';

interface DashboardProps {
    orders: Order[];
    products: Product[];
    users: User[];
    logs: LogEntry[];
    onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
    onAddOrUpdateProduct: (product: Partial<Product>) => void;
    onDeleteProduct: (productId: string) => void;
    onAddOrUpdateUser: (user: Partial<User>) => void;
    onDeleteUser: (userId: string) => void;
    initialTab: string | null;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
    const { currentUser } = useAuth();
    
    const userTabs = [
        { id: 'profile', label: 'Thông tin tài khoản' },
        { id: 'history', label: 'Lịch sử đơn hàng' }
    ];
    
    const adminTabs = [
        { id: 'profile', label: 'Thông tin tài khoản' },
        { id: 'history', label: 'Lịch sử đơn hàng' },
        { id: 'analytics', label: 'Báo cáo' },
        { id: 'orders', label: 'Quản lý đơn hàng' },
        { id: 'products', label: 'Quản lý sản phẩm' },
        { id: 'users', label: 'Quản lý người dùng' },
        { id: 'logs', label: 'Nhật ký hoạt động' }
    ];

    const tabs = currentUser?.role === 'admin' ? adminTabs : userTabs;
    const defaultTab = props.initialTab || tabs[0].id;
    const [activeTab, setActiveTab] = useState(defaultTab);
    
    const userOrders = useMemo(() => {
        if (!currentUser) return [];
        return props.orders.filter(o => o.userEmail === currentUser.email);
    }, [props.orders, currentUser]);

    if (!currentUser) return null;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return <UserProfile user={currentUser} onUpdateUser={(updatedUser) => props.onAddOrUpdateUser({...currentUser, ...updatedUser})} />;
            case 'history':
                return <OrderHistory orders={userOrders} />;
            case 'analytics':
                 return currentUser.role === 'admin' ? <Analytics /> : null;
            case 'orders':
                return currentUser.role === 'admin' ? <OrderManagement orders={props.orders} onUpdateStatus={props.onUpdateOrderStatus} /> : null;
            case 'products':
                return currentUser.role === 'admin' ? <ProductManagement products={props.products} onSave={props.onAddOrUpdateProduct} onDelete={props.onDeleteProduct} /> : null;
            case 'users':
                return currentUser.role === 'admin' ? <UserManagement users={props.users} onSave={props.onAddOrUpdateUser} onDelete={props.onDeleteUser} /> : null;
            case 'logs':
                return currentUser.role === 'admin' ? <LogViewer logs={props.logs} /> : null;
            default:
                return <UserProfile user={currentUser} onUpdateUser={(updatedUser) => props.onAddOrUpdateUser({...currentUser, ...updatedUser})} />;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="w-full md:w-64 flex-shrink-0">
                    <nav className="flex flex-col space-y-2">
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-left rounded transition-colors ${activeTab === tab.id ? 'bg-primary text-background font-bold' : 'hover:bg-secondary-light'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-grow bg-secondary p-6 rounded-lg border border-border">
                    {renderTabContent()}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
