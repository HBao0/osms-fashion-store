import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Notification } from '../types';

interface HeaderProps {
    onNavigate: (view: 'store' | 'login' | 'dashboard') => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    notifications: Notification[];
    onToggleNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, searchTerm, onSearchChange, notifications, onToggleNotifications }) => {
    const { currentUser } = useAuth();
    const { cartItemCount, toggleCart } = useCart();
    const unreadCount = notifications.filter(n => !n.read).length;
    const { logout } = useAuth();

    // Dropdown state & ref for outside click
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    return (
        <header className="bg-secondary border-b border-border sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
                <div className="flex items-center gap-8">
                    <h1 
                        className="text-3xl font-bold text-text cursor-pointer"
                        onClick={() => onNavigate('store')}
                    >
                        OSMS
                    </h1>
                    <div className="hidden md:flex items-center gap-3">
                        <a href="#" className="text-text-light hover:text-text"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3v8.5h4v-8.5Z"/></svg></a>
                        <a href="#" className="text-text-light hover:text-text"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98-3.56-.18-6.73-1.89-8.84-4.48-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.22-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21A12.93 12.93 0 0 0 21.46 7.2c0-.2 0-.4-.02-.6.9-.63 1.68-1.42 2.28-2.3Z"/></svg></a>
                        <a href="#" className="text-text-light hover:text-text"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919A48.907 48.907 0 0 1 12 2.163Zm0 3.723a6.112 6.112 0 1 0 0 12.224a6.112 6.112 0 0 0 0-12.224Zm0 9.947a3.834 3.834 0 1 1 0-7.668a3.834 3.834 0 0 1 0 7.668Zm5.438-9.888a1.427 1.427 0 1 1-2.854 0a1.427 1.427 0 0 1 2.854 0Z" clipRule="evenodd" /></svg></a>
                    </div>
                </div>

                <div className="flex-1 max-w-2xl mx-4 relative">
                     <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-5 h-5 text-text-light" viewBox="0 0 24 24" fill="none">
                            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </span>
                    <input 
                        type="text"
                        placeholder="Tìm kiếm sản phẩm, danh mục..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                <nav className="flex items-center gap-6">
                    <button onClick={onToggleNotifications} className="relative text-text-light hover:text-text transition-colors" aria-label={`Xem thông báo. ${unreadCount} chưa đọc.`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a1 1 0 00-2 0v.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-600 text-white font-bold text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-live="polite">{unreadCount}</span>
                        )}
                    </button>

                    {/* User avatar / login button */}
                    {currentUser ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen(open => !open)}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-background border border-border overflow-hidden focus:outline-none"
                                aria-haspopup="true"
                                aria-expanded={menuOpen}
                                aria-label="Mở menu người dùng"
                            >
                                {currentUser.avatar ? (
                                    <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 object-cover" />
                                ) : (
                                    <span className="text-sm font-medium text-text">{(currentUser.name || 'U').charAt(0).toUpperCase()}</span>
                                )}
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-50" role="menu">
                                    <div className="px-4 py-3 border-b border-border">
                                        <div className="font-medium text-text">{currentUser.name}</div>
                                        <div className="text-xs text-text-light">{currentUser.email}</div>
                                    </div>
                                    <div className="flex flex-col py-2">
                                        <button
                                            className="text-left px-4 py-2 hover:bg-primary/10 text-text"
                                            onClick={() => { setMenuOpen(false); onNavigate('dashboard'); }}
                                            role="menuitem"
                                        >
                                            Trang quản lý
                                        </button>
                                        <button
                                            className="text-left px-4 py-2 hover:bg-primary/10 text-text"
                                            onClick={() => { logout(); setMenuOpen(false); onNavigate('store'); }}
                                            role="menuitem"
                                        >
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => onNavigate('login')} className="text-text-light hover:text-text transition-colors" aria-label="Đăng nhập">
                           <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </button>
                    )}

                    <button onClick={() => toggleCart()} className="relative text-text-light hover:text-text transition-colors" aria-label={`Xem giỏ hàng của bạn. ${cartItemCount} sản phẩm.`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-primary text-background font-bold text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-hidden="true">{cartItemCount}</span>
                        )}
                    </button>
                </nav>
            </div>
        </header>
    );
};