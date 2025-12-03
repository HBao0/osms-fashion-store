import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface RegisterProps {
    onRegisterSuccess: () => void;
    onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Thêm state để quản lý loading và hiện mật khẩu
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
    const { register } = useAuth();

    // Hàm validate mật khẩu chuẩn (giống các component khác)
    const validatePassword = (password: string) => {
        if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
        if (password.length > 30) return "Mật khẩu không được quá 30 ký tự.";
        if (!/[a-z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ thường.";
        if (!/[A-Z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ hoa.";
        if (!/\d/.test(password)) return "Mật khẩu phải có ít nhất 1 số.";
        if (!/[^A-Za-z0-9]/.test(password)) return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#...).";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Validate Tên
        if (!name.trim()) {
            toast.error("Vui lòng nhập họ và tên.");
            return;
        }
        if (name.trim().length < 3 || name.trim().length > 30) {
            toast.error("Họ tên phải từ 3 đến 30 ký tự.");
            return;
        }

        // 2. Validate Email
        if (!email.trim()) {
            toast.error("Vui lòng nhập địa chỉ Email.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Email không đúng định dạng.");
            return;
        }

        // 3. Validate Mật khẩu
        if (!password) {
            toast.error("Vui lòng nhập mật khẩu.");
            return;
        }
        const passwordError = validatePassword(password);
        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        // 4. Gọi API Đăng ký
        try {
            setIsLoading(true); // Bắt đầu loading
            const error = await register({ name, email, password });
            
            if (error) {
                // Nếu useAuth trả về lỗi string (ví dụ: Email đã tồn tại)
                toast.error(error); 
            } else {
                toast.success("Đăng ký tài khoản thành công!");
                onRegisterSuccess();
            }
        } catch (err) {
            toast.error("Đã xảy ra lỗi trong quá trình đăng ký.");
        } finally {
            setIsLoading(false); // Kết thúc loading dù thành công hay thất bại
        }
    };

    return (
        <div className="max-w-md mx-auto bg-secondary p-8 rounded-lg shadow-lg border border-border">
            <h2 className="text-2xl font-bold text-center mb-6">Đăng ký tài khoản</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-light">Họ và tên</label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        disabled={isLoading}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-secondary-light rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50"
                        placeholder="Nhập họ tên của bạn"
                    />
                </div>
                <div>
                    <label htmlFor="email-register" className="block text-sm font-medium text-text-light">Email</label>
                    <input
                        id="email-register"
                        name="email"
                        type="email"
                        disabled={isLoading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-secondary-light rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50"
                        placeholder="example@email.com"
                    />
                </div>
                <div>
                    <label htmlFor="password-register" className="block text-sm font-medium text-text-light">Mật khẩu</label>
                    <div className="relative mt-1">
                        <input
                            id="password-register"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            disabled={isLoading}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full px-3 py-2 bg-background border border-secondary-light rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50 pr-10"
                            placeholder="Nhập mật khẩu mạnh"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? "Ẩn" : "Hiện"}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        * 8-30 ký tự, bao gồm hoa, thường, số và ký tự đặc biệt.
                    </p>
                </div>
                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-secondary bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang xử lý...
                            </span>
                        ) : (
                            "Đăng ký"
                        )}
                    </button>
                </div>
            </form>
            <p className="mt-6 text-center text-sm text-text-light">
                Đã có tài khoản?{' '}
                <button 
                    onClick={isLoading ? undefined : onSwitchToLogin} 
                    className={`font-medium text-primary hover:text-primary-dark ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Đăng nhập
                </button>
            </p>
        </div>
    );
};