import React, { useState, useEffect, useRef } from 'react';
import PhoneInput from '../PhoneInput';
import { User } from '../../types';
import toast from 'react-hot-toast';
import * as api from '../../services/api';

interface UserProfileProps {
    user: User;
    onUpdateUser: (user: Partial<User>) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
    const [formData, setFormData] = useState(user);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFormData(user);
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    // --- VALIDATION LOGIC ---

    // 1. Validate Password (Độ mạnh mật khẩu)
    const validatePassword = (password: string) => {
        if (password.length < 8) return "Mật khẩu mới phải có ít nhất 8 ký tự.";
        if (password.length > 30) return "Mật khẩu mới không được vượt quá 30 ký tự.";
        if (!/[a-z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ thường.";
        if (!/[A-Z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ hoa.";
        if (!/\d/.test(password)) return "Mật khẩu phải có ít nhất 1 số.";
        if (!/[^A-Za-z0-9]/.test(password)) return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#...).";
        return null;
    };

    // 2. Validate Profile (Tên, Email, SĐT, Tuổi)
    const validateProfile = () => {
        // Validate Tên
        if (!formData.name || formData.name.trim().length < 3 || formData.name.trim().length > 30) {
            toast.error('Tên hiển thị phải từ 3 đến 30 ký tự.');
            return false;
        }

        // Validate Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
            toast.error('Email không đúng định dạng.');
            return false;
        }

        // Validate Số điện thoại (Giả sử 8-11 số)
        if (!formData.phone || formData.phone.length < 8 || formData.phone.length > 11) {
            toast.error('Số điện thoại không hợp lệ (8-11 số).');
            return false;
        }

        // Validate Tuổi (>= 18)
        if (formData.birthDate) {
            const today = new Date();
            const birthDate = new Date(formData.birthDate);
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                toast.error('Bạn phải đủ 18 tuổi để cập nhật thông tin này.');
                return false;
            }
             if (age > 100) {
                toast.error('Năm sinh không hợp lệ.');
                return false;
            }
        }

        return true;
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Chạy validate toàn bộ profile
        if (!validateProfile()) return;

        // Tách password ra khỏi dữ liệu update profile để tránh gửi nhầm
        const { password, ...profileData } = formData;
        onUpdateUser(profileData);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 1. Kiểm tra rỗng
        if (!passwordData.newPassword || !passwordData.currentPassword) {
            toast.error('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.');
            return;
        }

        // 2. Validate độ mạnh mật khẩu
        const errorMsg = validatePassword(passwordData.newPassword);
        if (errorMsg) {
            toast.error(errorMsg);
            return;
        }

        const loadingToast = toast.loading('Đang đổi mật khẩu...');
        try {
            await api.changePassword(user.id, passwordData);
            toast.success('Đổi mật khẩu thành công!', { id: loadingToast });
            setPasswordData({ currentPassword: '', newPassword: '' }); // Clear fields
        } catch (error: any) {
            toast.error(error.message || 'Đổi mật khẩu thất bại.', { id: loadingToast });
        }
    };
    
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

    return (
        <div>
            {/* --- Avatar & Header Section --- */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                 <div className="relative group">
                    <img 
                        src={formData.avatar || `https://ui-avatars.com/api/?name=${initials}&background=FBBF24&color=0d1117&size=96`} 
                        alt="Avatar" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-border" 
                    />
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity cursor-pointer" onClick={triggerFileSelect}>
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm bg-black/70 px-3 py-1 rounded-full">
                            Thay đổi
                        </span>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <div>
                    <h2 className="text-2xl font-bold text-center sm:text-left">{user.name}</h2>
                    <p className="text-text-light text-center sm:text-left">{user.email}</p>
                </div>
            </div>
            
            {/* --- Profile Form --- */}
            <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg pb-8 border-b border-border">
                <div>
                    <label className="block text-sm font-medium text-text-light">Họ và tên</label>
                    <input 
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <p className="text-xs text-gray-500 mt-1">Độ dài từ 3 đến 30 ký tự.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-light">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-light">Số điện thoại</label>
                    <PhoneInput 
                        name="phone" 
                        value={formData.phone} 
                        onChange={(v: string) => setFormData({ ...formData, phone: v })} 
                        placeholder="Nhập số điện thoại" 
                        className="mt-1 w-full" 
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-light">Ngày sinh</label>
                    <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate ? formData.birthDate.toString().split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                </div>

                <div>
                    <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark transition-colors shadow-md">
                        Lưu thông tin
                    </button>
                </div>
            </form>

            {/* --- Password Form --- */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg pt-8">
                <h3 className="text-xl font-bold">Đổi mật khẩu</h3>
                 <div>
                    <label className="block text-sm font-medium text-text-light">Mật khẩu hiện tại</label>
                    <input 
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-light">Mật khẩu mới</label>
                    <input 
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        * 8-30 ký tự, gồm hoa, thường, số và ký tự đặc biệt.
                    </p>
                </div>
                 <div>
                    <button type="submit" className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-300 transition-colors">
                        Lưu thay đổi
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;