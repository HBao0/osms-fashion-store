import { Product, User, Order, LogEntry, Voucher, AnalyticsData, PaginatedProducts, Category, Filters, SortBy, Review } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  if (response.status === 204) {
      return {} as T;
  }
  return response.json();
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const userJson = sessionStorage.getItem('currentUser');
  const headersObj: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (userJson) {
    const user = JSON.parse(userJson);
    if (user && user.email) {
      headersObj['x-user-email'] = user.email;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: headersObj as HeadersInit,
  });
    return handleResponse<T>(response);
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

// Function to clear the product cache, called on mutation
const clearProductCache = () => {
    // Since filtering is now complex, we clear the entire cache on any product change.
    // A more advanced strategy could parse the cache keys and only delete relevant ones.
    console.log('Clearing all product list caches...');
    // This is a placeholder for a more advanced cache invalidation if needed.
    // For now, mutations will require a fresh fetch.
};


// --- Category API ---
export const getCategories = () => apiRequest<Category[]>('/categories');

// --- Product APIs ---
export const getProducts = (
    { searchTerm, category, filters, sortBy, page = 1, limit = 20 }: 
    { searchTerm?: string, category?: string, filters: Filters, sortBy: SortBy, page: number, limit?: number }
): Promise<PaginatedProducts> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    if (searchTerm) params.append('search', searchTerm);
    if (category && category !== 'all') params.append('category', category);
    if (sortBy) params.append('sortBy', sortBy);
    
    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            if (Array.isArray(value)) {
                value.forEach(v => params.append(key, v));
            } else {
                params.append(key, String(value));
            }
        }
    });

    const endpoint = `/products?${params.toString()}`;
    return apiRequest<PaginatedProducts>(endpoint);
}
export const getProductById = (id: string) => apiRequest<Product>(`/products/${id}`);

export const saveProduct = (product: Partial<Product>) => {
  clearProductCache();
  const method = product.id ? 'PUT' : 'POST';
  const endpoint = product.id ? `/products/${product.id}` : '/products';
  return apiRequest<Product>(endpoint, { method, body: JSON.stringify(product) });
};
export const deleteProduct = (id: string) => {
    clearProductCache();
    return apiRequest<void>(`/products/${id}`, { method: 'DELETE' });
};

// --- User & Auth APIs ---
export const getUsers = () => apiRequest<User[]>('/users');
export const login = (credentials: {email: string, password: string}) => apiRequest<User>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const register = (userData: Omit<User, 'id' | 'role'>) => apiRequest<User>('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
export const saveUser = (user: Partial<User>) => {
  const method = user.id ? 'PUT' : 'POST';
  const endpoint = user.id ? `/users/${user.id}` : '/users';
  return apiRequest<User>(endpoint, { method, body: JSON.stringify(user) });
};
export const deleteUser = (id: string) => apiRequest<void>(`/users/${id}`, { method: 'DELETE' });
export const changePassword = (userId: string, passwords: { currentPassword: string, newPassword: string }) => 
    apiRequest<{ message: string }>(`/users/${userId}/password`, { method: 'PATCH', body: JSON.stringify(passwords) });


// --- Order APIs ---
export const getOrders = () => apiRequest<Order[]>('/orders');
export const createOrder = (orderData: any) => apiRequest<Order>('/orders', { method: 'POST', body: JSON.stringify(orderData) });
export const updateOrderStatus = (orderId: string, status: Order['status']) => 
  apiRequest<Order>(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const confirmOrderPayment = (orderId: string) => apiRequest<Order>(`/orders/${orderId}/confirm_payment`, { method: 'PATCH' });
export const cancelOrder = (orderId: string) => apiRequest<Order>(`/orders/${orderId}/cancel`, { method: 'PATCH' });


// --- Log APIs ---
export const getLogs = () => apiRequest<LogEntry[]>('/logs');
// logAction supports two forms for convenience:
// - logAction(action: string, details?: string)  --> backend will infer user from header
// - logAction(userEmail: string, userName: string, action: string, details?: string) --> explicit
export const logAction = (...args: any[]) => {
  if (args.length === 1 || args.length === 2) {
    const [action, details = ''] = args as [string, string?];
    const logData = { action, details };
    return apiRequest<LogEntry>('/logs', { method: 'POST', body: JSON.stringify(logData) });
  }
  const [userEmail, userName, action, details = ''] = args as [string, string, string, string?];
  const logData = { userEmail, userName, action, details };
  return apiRequest<LogEntry>('/logs', { method: 'POST', body: JSON.stringify(logData) });
};

// --- Voucher API ---
export const applyVoucher = (code: string, subtotal: number) => 
    apiRequest<Voucher>('/vouchers/apply', { method: 'POST', body: JSON.stringify({ code, subtotal }) });

// --- Analytics API ---
export const getAnalyticsSummary = () => apiRequest<AnalyticsData>('/analytics/summary');

// --- Review APIs ---
export const getReviews = (productId: string) => apiRequest<Review[]>(`/products/${productId}/reviews`);
export const submitReview = (productId: string, reviewData: { rating: number; comment: string }) => 
    apiRequest<Review>(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(reviewData) });