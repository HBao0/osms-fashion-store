import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
interface LoginProps {
    onLoginSuccess: () => void;
    onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    // Validate: email rỗng
    if (!email.trim()) {
        toast.error("Vui lòng nhập địa chỉ Email.");
        return;
    }

    // Validate: email sai format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        toast.error("Email không đúng định dạng (ví dụ: abc@domain.com).");
        return;
    }

    // Validate: password rỗng
    if (!password.trim()) {
        toast.error("Vui lòng nhập mật khẩu.");
        return;
    }

        const error = await login(email, password);
        if (!error) {
            onLoginSuccess();
        }
        
    };

    return (
        <div className="max-w-md mx-auto bg-secondary p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-light">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        // required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-secondary-light rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-text-light">Mật khẩu</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        // required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-secondary-light rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                </div>
                <div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-secondary bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
                    >
                        Đăng nhập
                    </button>
                </div>
            </form>
            <p className="mt-6 text-center text-sm text-text-light">
                Chưa có tài khoản?{' '}
                <button onClick={onSwitchToRegister} className="font-medium text-primary hover:text-primary-dark">
                    Đăng ký ngay
                </button>
            </p>
        </div>
    );
};
