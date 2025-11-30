import React, { createContext, useState, useContext, useCallback } from 'react';
import { User } from '../types';
import * as api from '../services/api';
import toast from 'react-hot-toast';

// Helper for session storage
const saveUserToSession = (user: User) => sessionStorage.setItem('currentUser', JSON.stringify(user));
const getUserFromSession = (): User | null => {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
};
const removeUserFromSession = () => sessionStorage.removeItem('currentUser');

interface AuthContextType {
    currentUser: User | null;
    login: (email: string, password?: string) => Promise<string | null>;
    register: (newUser: Omit<User, 'id' | 'role'|'password'> & {password: string}) => Promise<string | null>;
    logout: () => void;
    updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(getUserFromSession());

    const login = useCallback(async (email: string, password?: string): Promise<string | null> => {
        const loadingToast = toast.loading('Đang đăng nhập...');
        try {
            const user = await api.login({ email, password: password || '' });
            setCurrentUser(user);
            saveUserToSession(user);
            // FIX: The logAction function signature has changed. User info is now inferred by the backend.
            api.logAction('User Login');
            toast.success(`Chào mừng trở lại, ${user.name}!`, { id: loadingToast });
            return null;
        } catch (error: any) {
            toast.error(error.message || 'Đăng nhập thất bại.', { id: loadingToast });
            return error.message || 'Đăng nhập thất bại.';
        }
    }, []);

    const register = useCallback(async (newUser: Omit<User, 'id' | 'role'|'password'> & {password: string}): Promise<string | null> => {
        const loadingToast = toast.loading('Đang đăng ký...');
        try {
            const registeredUser = await api.register(newUser);
            setCurrentUser(registeredUser);
            saveUserToSession(registeredUser);
            // FIX: The logAction function signature has changed. User info is now inferred by the backend.
            api.logAction('User Register');
            toast.success('Đăng ký thành công!', { id: loadingToast });
            return null;
        } catch (error: any) {
            toast.error(error.message || 'Đăng ký thất bại.', { id: loadingToast });
            return error.message || 'Đăng ký thất bại.';
        }
    }, []);
    
    const logout = useCallback(() => {
        if (currentUser) {
            // FIX: The logAction function signature has changed. User info is now inferred by the backend.
            api.logAction('User Logout');
            removeUserFromSession();
            setCurrentUser(null);
            toast.success('Đã đăng xuất.');
        }
    }, [currentUser]);

    const updateCurrentUser = (user: User) => {
        setCurrentUser(user);
        saveUserToSession(user);
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, register, logout, updateCurrentUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};