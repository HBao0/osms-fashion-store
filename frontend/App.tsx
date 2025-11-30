import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { User, CartItem, Notification, Order, Product, LogEntry } from './types';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Store } from './pages/Store';
import { Checkout } from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import { VOUCHERS } from './constants';
import { CartPanel } from './components/CartPanel';
import { useDebounce } from './hooks/useDebounce';
import * as api from './services/api';

type View = 'store' | 'login' | 'register' | 'checkout' | 'dashboard';

// Helper for session storage to remember the logged in user
const saveCurrentUserToSession = (user: User) => sessionStorage.setItem('currentUser', JSON.stringify(user));
const getCurrentUserFromSession = (): User | null => {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
};
const removeCurrentUserFromSession = () => sessionStorage.removeItem('currentUser');


const App: React.FC = () => {
  const [view, setView] = useState<View>('store');
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUserFromSession());
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [discount, setDiscount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [dashboardInitialTab, setDashboardInitialTab] = useState<string | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Centralized state for all data fetched from backend
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch all initial data from the server
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [products, users, ordersData, logsData] = await Promise.all([
          api.getProducts(),
          api.getUsers(),
          api.getOrders(),
          api.getLogs(),
        ]);
        setAllProducts(products);
        setAllUsers(users);
        setOrders(ordersData);
        setLogs(logsData);
      } catch (error) {
        console.error("Failed to load initial data from server:", error);
        // Handle error display for user
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);
  

  useEffect(() => {
    // Mock notifications based on user role
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setNotifications([
          { id: '1', title: 'Đơn hàng mới', description: 'Bạn có một đơn hàng mới từ khách hàng Nguyen Van A.', read: false },
          { id: '2', title: 'Cảnh báo hết hàng', description: 'Sản phẩm "Áo Thun Cotton Basic" sắp hết hàng.', read: true },
        ]);
      } else {
        setNotifications([
          { id: '4', title: 'Đơn hàng đã vận chuyển', description: 'Đơn hàng #12345 của bạn đã được giao cho đơn vị vận chuyển.', read: false },
          { id: '5', title: 'Flash Sale sắp bắt đầu!', description: 'Đừng bỏ lỡ sự kiện Flash Sale sẽ bắt đầu trong 1 giờ nữa.', read: false },
        ]);
      }
    } else {
      setNotifications([]);
    }
  }, [currentUser]);
  
  const handleLogin = async (email: string, password?: string): Promise<string | null> => {
    try {
        const user = await api.login({ email, password: password || '' });
        setCurrentUser(user);
        saveCurrentUserToSession(user);
        setView('store');
        return null;
    } catch (error: any) {
        return error.message || 'Đăng nhập thất bại.';
    }
  };

  const handleRegister = async (newUser: Omit<User, 'id' | 'role'>): Promise<string | null> => {
    try {
        const registeredUser = await api.register(newUser);
        setCurrentUser(registeredUser);
        saveCurrentUserToSession(registeredUser);
        setView('store');
        return null;
    } catch (error: any) {
        return error.message || 'Đăng ký thất bại.';
    }
  }

  const handleLogout = () => {
    if(currentUser) api.logAction(currentUser.email, currentUser.name, 'User Logout');
    removeCurrentUserFromSession();
    setCurrentUser(null);
    setView('store');
  };
  
  const handleAddToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems(prevItems => {
      if (quantity <= 0) {
        return prevItems.filter(item => item.id !== productId);
      }
      return prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const handleApplyVoucher = (code: string) => {
    const upperCaseCode = code.toUpperCase();
    setVoucherCode(upperCaseCode);
    const voucher = VOUCHERS[upperCaseCode];
    if (voucher) {
      const subtotal = cartItems.reduce((total, item) => total + item.finalPrice * item.quantity, 0);
      if(voucher.type === 'percent') {
        setDiscount(subtotal * (voucher.value / 100));
      } else {
        setDiscount(voucher.value);
      }
      setVoucherError('');
    } else {
      setDiscount(0);
      setVoucherError('Mã voucher không hợp lệ.');
    }
  };

  const handlePlaceOrder = async (shippingInfo: any) => {
    if (!currentUser) return;
    const subtotal = cartItems.reduce((total, item) => total + item.finalPrice * item.quantity, 0);
    const finalTotal = subtotal - discount;

    const orderData = {
      userEmail: currentUser.email,
      items: cartItems,
      subtotal,
      discount,
      total: finalTotal,
      shippingInfo,
    };
    
    try {
      const newOrder = await api.createOrder(orderData);
      setOrders(prev => [newOrder, ...prev]);
      setCartItems([]);
      setVoucherCode('');
      setDiscount(0);
      setDashboardInitialTab(currentUser.role === 'admin' ? 'orders' : 'history');
      setView('dashboard');
    } catch(error) {
        alert("Đặt hàng thất bại, vui lòng thử lại.");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
        const updatedOrder = await api.updateOrderStatus(orderId, status);
        setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
    } catch (error) {
        alert("Cập nhật trạng thái thất bại.");
    }
  };
  
  const handleAddOrUpdateProduct = async (product: Product) => {
    try {
        const savedProduct = await api.saveProduct(product);
        if (product.id) {
             setAllProducts(allProducts.map(p => p.id === savedProduct.id ? savedProduct : p));
        } else {
            setAllProducts([savedProduct, ...allProducts]);
        }
    } catch(error) {
        alert("Lưu sản phẩm thất bại.");
    }
  }

  const handleDeleteProduct = async (productId: string) => {
     try {
        await api.deleteProduct(productId);
        setAllProducts(allProducts.filter(p => p.id !== productId));
    } catch (error) {
        alert("Xóa sản phẩm thất bại.");
    }
  }

  const handleAddOrUpdateUser = async (user: User) => {
    try {
        const savedUser = await api.saveUser(user);
        if (user.id) {
            setAllUsers(allUsers.map(u => u.id === savedUser.id ? savedUser : u));
        } else {
            setAllUsers([savedUser, ...allUsers]);
        }
        if (currentUser && currentUser.id === savedUser.id) {
            setCurrentUser(savedUser);
            saveCurrentUserToSession(savedUser);
        }
    } catch (error) {
        alert("Lưu người dùng thất bại.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
        await api.deleteUser(userId);
        setAllUsers(allUsers.filter(u => u.id !== userId));
    } catch (error) {
        alert("Xóa người dùng thất bại.");
    }
  }

  const cartItemCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const renderContent = () => {
    switch(view) {
        case 'login':
            return <Login onLogin={handleLogin} onSwitchToRegister={() => setView('register')} />;
        case 'register':
            return <Register onRegister={handleRegister} onSwitchToLogin={() => setView('login')} />;
        case 'checkout':
            if (!currentUser) { setView('login'); return null; }
            return <Checkout 
                        cartItems={cartItems} 
                        discount={discount}
                        onPlaceOrder={handlePlaceOrder}
                        onBack={() => { setView('store'); setIsCartOpen(true); }}
                   />;
        case 'dashboard':
            if (!currentUser) { setView('login'); return null; }
            return <Dashboard 
                      user={currentUser} 
                      orders={orders} 
                      products={allProducts}
                      users={allUsers}
                      logs={logs}
                      onUpdateOrderStatus={handleUpdateOrderStatus}
                      onAddOrUpdateProduct={handleAddOrUpdateProduct}
                      onDeleteProduct={handleDeleteProduct}
                      onAddOrUpdateUser={handleAddOrUpdateUser}
                      onDeleteUser={handleDeleteUser}
                      initialTab={dashboardInitialTab}
                   />;
        case 'store':
        default:
            return <Store 
                      onAddToCart={handleAddToCart} 
                      products={allProducts} 
                      isLoading={isLoading}
                      searchTerm={debouncedSearchTerm} 
                   />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-text">
      <Header 
        user={currentUser}
        onNavigate={(view) => { setView(view); setDashboardInitialTab(null); }}
        onLogout={handleLogout}
        cartItemCount={cartItemCount}
        onToggleCart={() => setIsCartOpen(!isCartOpen)}
        notifications={notifications}
        isNotificationsOpen={isNotificationsOpen}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      {renderContent()}
      <Footer />
      <CartPanel 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onNavigateToCheckout={() => {
          setIsCartOpen(false);
          if (currentUser) {
            setView('checkout');
          } else {
            setView('login');
          }
        }}
        voucherCode={voucherCode}
        onApplyVoucher={handleApplyVoucher}
        voucherError={voucherError}
        discount={discount}
      />
    </div>
  );
};

export default App;
