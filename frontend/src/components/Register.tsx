import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
    onRegisterSuccess: () => void;
    onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const error = await register({ name, email, password });
        if (!error) {
            onRegisterSuccess();
        }
    };

    return (
        <div className="max-w-md mx-auto bg-secondary p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center mb-6">Đăng ký tài khoản</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-light">Họ và tên</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-secondary-light rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                </div>
                <div>
                    <label htmlFor="email-register" className="block text-sm font-medium text-text-light">Email</label>
                    <input
                        id="email-register"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-secondary-light rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                </div>
                <div>
                    <label htmlFor="password-register" className="block text-sm font-medium text-text-light">Mật khẩu</label>
                    <input
                        id="password-register"
                        name="password"
                        type="password"
                        required
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
                        Đăng ký
                    </button>
                </div>
            </form>
            <p className="mt-6 text-center text-sm text-text-light">
                Đã có tài khoản?{' '}
                <button onClick={onSwitchToLogin} className="font-medium text-primary hover:text-primary-dark">
                    Đăng nhập
                </button>
            </p>
        </div>
    );
};
