export interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    style: string;
    sizes: string[];
    colors: string[];
    price: number;
    discount: number;
    finalPrice: number;
    images: string[];
    sku: string;
    stock: number;
    rating: number;
    isFlashSale: boolean;
    isNew: boolean;
    heelHeight?: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    phone?: string;
    avatar?: string;
    birthDate?: string;
    password?: string; // Should only be present when creating/updating
}

export interface CartItem extends Product {
    quantity: number;
}

export interface ShippingInfo {
    name: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    note?: string;
}

export interface Order {
    id: string;
    userEmail: string;
    date: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    status: 'Đang xử lý' | 'Đang giao hàng' | 'Đã giao' | 'Đã hủy' | 'Chờ thanh toán';
    shippingInfo: ShippingInfo;
    voucherCode?: string;
    paymentMethod: 'COD' | 'Online';
    // paymentProvider: optional provider identifier for online payments (e.g. 'momo', 'vnpay', 'card')
    paymentProvider?: string;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    userEmail: string;
    userName: string;
    action: string;
    details?: string;
}

export interface Notification {
    id: string;
    title: string;
    description: string;
    read: boolean;
}

export interface Voucher {
    code: string;
    type: 'percent' | 'fixed';
    value: number;
    description: string;
    minPurchase: number;
    expiresAt?: string;
    isActive: boolean;
}

export interface AppliedVoucher extends Voucher {
    discountAmount: number;
}

export interface AnalyticsData {
    totalRevenue: number;
    totalOrders: number;
    newOrders: number;
    monthlyRevenue: { month: string; revenue: number }[];
}

export interface PaginatedProducts {
    data: Product[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
}

export interface Category {
    name: string;
    count: number;
}

export type Filters = {
    style?: string[];
    color?: string[];
    productType?: string[];
    size?: string[];
    heelHeight?: string[];
};

export type SortBy = 'default' | 'price_asc' | 'price_desc' | 'newest';

export interface Review {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    createdAt: string;
}
