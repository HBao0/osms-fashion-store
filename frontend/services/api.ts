import { Product, User, Order, LogEntry } from '../types';

const API_BASE_URL = 'http://localhost:3001/api'; // Your backend server URL

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  return response.json();
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    return handleResponse<T>(response);
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

// --- Product APIs ---
export const getProducts = () => apiRequest<Product[]>('/products');
export const saveProduct = (product: Product) => {
  const method = product.id ? 'PUT' : 'POST';
  const endpoint = product.id ? `/products/${product.id}` : '/products';
  return apiRequest<Product>(endpoint, { method, body: JSON.stringify(product) });
};
export const deleteProduct = (id: string) => apiRequest<void>(`/products/${id}`, { method: 'DELETE' });

// --- User & Auth APIs ---
export const getUsers = () => apiRequest<User[]>('/users');
export const login = (credentials: {email: string, password: string}) => apiRequest<User>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const register = (userData: Omit<User, 'id' | 'role'>) => apiRequest<User>('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
export const saveUser = (user: User) => {
  const method = user.id ? 'PUT' : 'POST';
  const endpoint = user.id ? `/users/${user.id}` : '/users';
  return apiRequest<User>(endpoint, { method, body: JSON.stringify(user) });
};
export const deleteUser = (id: string) => apiRequest<void>(`/users/${id}`, { method: 'DELETE' });


// --- Order APIs ---
export const getOrders = () => apiRequest<Order[]>('/orders');
export const createOrder = (orderData: any) => apiRequest<Order>('/orders', { method: 'POST', body: JSON.stringify(orderData) });
export const updateOrderStatus = (orderId: string, status: Order['status']) => 
  apiRequest<Order>(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// --- Log APIs ---
export const getLogs = () => apiRequest<LogEntry[]>('/logs');
export const logAction = (userEmail: string, userName: string, action: string, details: string = '') => {
    const logData = { userEmail, userName, action, details };
    return apiRequest<LogEntry>('/logs', { method: 'POST', body: JSON.stringify(logData) });
};
