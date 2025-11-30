import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Order, Product, User, LogEntry, Category, Filters, SortBy, Notification } from './types';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Store } from './pages/Store';
import { Checkout } from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import ProductDetail from './pages/ProductDetail';
import MockPayment from './pages/MockPayment';
import { useAuth } from './contexts/AuthContext';
import * as api from './services/api';
import { useDebounce } from './hooks/useDebounce';
import { useCart } from './contexts/CartContext';
import toast from 'react-hot-toast';
import { CartPanel } from './components/CartPanel';
import { NotificationsPanel } from './components/NotificationsPanel';

type View = 'store' | 'login' | 'register' | 'checkout' | 'dashboard' | 'productDetail' | 'mockPayment';
type PaymentMethod = 'COD' | 'Online';

const App: React.FC = () => {
  const [view, setView] = useState<View>('store');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [dashboardInitialTab, setDashboardInitialTab] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Store page state (filters, sorting, pagination)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filters, setFilters] = useState<Filters>({});
  const [sortBy, setSortBy] = useState<SortBy>('default');
  
  // State for online payment flow
  const [orderForPayment, setOrderForPayment] = useState<Order | null>(null);
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);


  const { currentUser, updateCurrentUser } = useAuth();
  const { clearCart } = useCart();

  // Centralized state for all data fetched from backend
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // --- DATA FETCHING ---
  
  useEffect(() => {
    // Mock notifications based on user role
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setNotifications([
          { id: '1', title: 'Đơn hàng mới', description: 'Bạn có một đơn hàng mới từ khách hàng Nguyen Van A.', read: false },
          { id: '2', title: 'Cảnh báo hết hàng', description: 'Sản phẩm "Áo Thun Cotton Basic" sắp hết hàng.', read: true },
          { id: '3', title: 'Người dùng mới đăng ký', description: 'user11@example.com vừa tạo tài khoản.', read: false },
        ]);
      } else {
        setNotifications([
          { id: '4', title: 'Đơn hàng đã vận chuyển', description: 'Đơn hàng #DH-1696377709538 của bạn đã được giao cho đơn vị vận chuyển.', read: false },
          { id: '5', title: 'Flash Sale sắp bắt đầu!', description: 'Đừng bỏ lỡ sự kiện Flash Sale sẽ bắt đầu trong 1 giờ nữa.', read: false },
          { id: '6', title: 'Đánh giá của bạn đã được duyệt', description: 'Cảm ơn bạn đã đánh giá sản phẩm "Váy Hoa Nhí Vintage".', read: true },
        ]);
      }
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await api.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Reset page to 1 when search term, category, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCategory, filters, sortBy]);

  // Main product fetching effect
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const response = await api.getProducts({
          searchTerm: debouncedSearchTerm,
          category: selectedCategory,
          page: currentPage,
          filters,
          sortBy
        });
        setAllProducts(response.data);
        setTotalPages(response.totalPages);
      } catch (error) {
        console.error("Failed to load products:", error);
        toast.error('Không thể tải danh sách sản phẩm.');
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [debouncedSearchTerm, currentPage, selectedCategory, filters, sortBy]);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (currentUser?.role === 'admin') {
        try {
          setIsLoading(true);
          const [users, ordersData, logsData] = await Promise.all([
            api.getUsers(),
            api.getOrders(),
            api.getLogs(),
          ]);
          setAllUsers(users);
          setOrders(ordersData);
          setLogs(logsData);
        } catch (error) {
          console.error("Failed to load admin data:", error);
          toast.error('Không thể tải dữ liệu quản trị.');
        } finally {
            setIsLoading(false);
        }
      }
    };
    fetchAdminData();
  }, [currentUser]);

  const handleNavigate = (newView: View, data?: any) => {
      if (newView === 'productDetail' && data?.productId) {
          setSelectedProductId(data.productId);
      } else {
          setSelectedProductId(null);
      }
      setDashboardInitialTab(null);
      setView(newView);
  }

  const handleNavigateToCheckout = () => {
    if (currentUser) {
        handleNavigate('checkout');
    } else {
        handleNavigate('login');
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('Đã đánh dấu tất cả là đã đọc.');
  };

  const handleNotificationClick = (n: Notification) => {
    // mark the notification as read locally
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));

    // Basic routing rules based on notification title/content
    const title = (n.title || '').toLowerCase();
    if (title.includes('đơn hàng')) {
      setDashboardInitialTab('history');
      setView('dashboard');
      setIsNotificationsOpen(false);
      return;
    }
    if (title.includes('cảnh báo') || title.includes('hết hàng')) {
      setDashboardInitialTab('products');
      setView('dashboard');
      setIsNotificationsOpen(false);
      return;
    }
    if (title.includes('người dùng') || title.includes('đăng ký')) {
      setDashboardInitialTab('users');
      setView('dashboard');
      setIsNotificationsOpen(false);
      return;
    }

    // Default: close panel
    setIsNotificationsOpen(false);
  };

  // --- ADMIN HANDLERS ---
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updatedOrder = await api.updateOrderStatus(orderId, status);
      setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
    } catch (error) {
      toast.error("Cập nhật trạng thái thất bại.");
    }
  };
  
  const handleAddOrUpdateProduct = async (product: Partial<Product>) => {
    try {
      await api.saveProduct(product);
      // After saving, force a refetch by changing a dependency of the product fetch effect.
      // A simple way is to refetch the current page.
      setCurrentPage(p => p); 
      toast.success('Lưu sản phẩm thành công!');
    } catch(error) {
      toast.error("Lưu sản phẩm thất bại.");
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      setCurrentPage(p => p);
      toast.success('Xóa sản phẩm thành công!');
    } catch (error) {
      toast.error("Xóa sản phẩm thất bại.");
    }
  }

  const handleAddOrUpdateUser = async (user: Partial<User>) => {
    try {
      const savedUser = await api.saveUser(user);
      if (user.id) {
        setAllUsers(allUsers.map(u => u.id === savedUser.id ? savedUser as User : u));
      } else {
        setAllUsers([savedUser as User, ...allUsers]);
      }
      if (currentUser && currentUser.id === savedUser.id) {
        updateCurrentUser(savedUser as User);
      }
      toast.success('Lưu người dùng thành công!');
    } catch (error: any) {
      toast.error(error.message || "Lưu người dùng thất bại.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.deleteUser(userId);
      setAllUsers(allUsers.filter(u => u.id !== userId));
      toast.success('Xóa người dùng thành công!');
    } catch (error) {
      toast.error("Xóa người dùng thất bại.");
    }
  }
  
  const handlePlaceOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status' | 'userEmail'>, paymentMethod: PaymentMethod) => {
      try {
        const newOrder = await api.createOrder(orderData);
        setOrders(prev => [newOrder, ...prev]);

    if (paymentMethod === 'Online') {
      setOrderForPayment(newOrder);
      setView('mockPayment');
    } else { // COD
      // For COD: redirect user to their order history (dashboard.history)
      clearCart();
      toast.success("Đặt hàng thành công!");

      // Create a backend log for admins and add a local notification
      try {
        const notif: Notification = {
          id: String(Date.now()),
          title: 'Đơn hàng mới (COD)',
          description: `Đơn ${newOrder.id} từ ${newOrder.shippingInfo?.name || newOrder.userEmail}`,
          read: false,
        };
        setNotifications(prev => [notif, ...prev]);
  // Log backend action for audit (backend will infer user info via header)
  await api.logAction('Order Created', `Order ${newOrder.id} created (COD)`);
      } catch (err) {
        console.error('Failed to notify/admin log', err);
      }

      setDashboardInitialTab('history');
      setView('dashboard');
    }
    } catch (error: any) {
      console.error('Place order error:', error);
      const message = error?.message || 'Đặt hàng thất bại, vui lòng thử lại.';
      toast.error(message);
    }
  };

  const handlePaymentSuccess = async (orderId: string) => {
      try {
        const updatedOrder = await api.confirmOrderPayment(orderId);
        setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
        clearCart();
        setOrderForPayment(null);
        setDashboardInitialTab(currentUser?.role === 'admin' ? 'orders' : 'history');
        toast.success("Thanh toán và đặt hàng thành công!");
        setView('dashboard');
      } catch (error) {
        toast.error("Xác nhận thanh toán thất bại.");
      }
  };

  const handlePaymentCancel = async (orderId: string) => {
      try {
        await api.cancelOrder(orderId);
        toast.error("Đơn hàng đã được hủy.");
      } catch (error) {
        console.error("Failed to cancel order", error);
      } finally {
        setOrderForPayment(null);
        setView('checkout');
      }
  };

  const renderContent = () => {
    switch(view) {
      case 'login':
        return <Login onLoginSuccess={() => handleNavigate('store')} onSwitchToRegister={() => handleNavigate('register')} />;
      case 'register':
        return <Register onRegisterSuccess={() => handleNavigate('store')} onSwitchToLogin={() => handleNavigate('login')} />;
      case 'checkout':
        if (!currentUser) { handleNavigate('login'); return null; }
        return <Checkout 
                  onPlaceOrder={handlePlaceOrder}
                  onBack={() => handleNavigate('store')}
                />;
      case 'mockPayment':
        if (!orderForPayment) { handleNavigate('store'); return null; }
        return <MockPayment 
                  order={orderForPayment}
                  onSuccess={() => handlePaymentSuccess(orderForPayment.id)}
                  onCancel={() => handlePaymentCancel(orderForPayment.id)}
                />
      case 'dashboard':
        if (!currentUser) { handleNavigate('login'); return null; }
        return <Dashboard 
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
      case 'productDetail':
          if (!selectedProductId) { handleNavigate('store'); return null; }
          return <ProductDetail productId={selectedProductId} onBack={() => handleNavigate('store')} />
      case 'store':
      default:
        return <Store 
                  products={allProducts} 
                  isLoading={isLoading}
                  onProductClick={(productId) => handleNavigate('productDetail', { productId })}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  filters={filters}
                  onFilterChange={setFilters}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-text">
      <Header 
        onNavigate={handleNavigate}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        notifications={notifications}
        onToggleNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
      />
      <main className="flex-grow w-full">
        {renderContent()}
      </main>
      <Footer />
      <CartPanel onNavigateToCheckout={handleNavigateToCheckout} />
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClickNotification={handleNotificationClick}
      />
    </div>
  );
};

export default App;