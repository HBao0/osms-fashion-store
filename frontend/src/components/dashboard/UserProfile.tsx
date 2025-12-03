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

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Don't submit password data with profile update
        const { password, ...profileData } = formData;
        onUpdateUser(profileData);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordData.newPassword || !passwordData.currentPassword) {
            toast.error('Vui lòng nhập cả mật khẩu hiện tại và mật khẩu mới.');
            return;
        }
        if (passwordData.newPassword.length < 6) {
             toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
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
    
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                 <div className="relative group">
                    <img 
                        src={formData.avatar || `https://ui-avatars.com/api/?name=${initials}&background=FBBF24&color=0d1117&size=96`} 
                        alt="Avatar" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-border" 
                    />
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-opacity">
                        <button onClick={triggerFileSelect} className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm bg-black/70 px-3 py-1 rounded-full">
                            Thay đổi
                        </button>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <div>
                    <h2 className="text-2xl font-bold text-center sm:text-left">{user.name}</h2>
                    <p className="text-text-light text-center sm:text-left">{user.email}</p>
                </div>
            </div>
            
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
                    <PhoneInput name="phone" value={formData.phone} onChange={(v: string) => setFormData({ ...formData, phone: v })} placeholder="Nhập số điện thoại" className="mt-1 w-full" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-light">Ngày sinh</label>
                    <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate ? formData.birthDate.split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 bg-background border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                </div>

                <div>
                    <button type="submit" className="bg-primary text-background font-bold py-2 px-4 rounded hover:bg-primary-dark transition-colors">
                        Lưu thông tin
                    </button>
                </div>
            </form>

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
                </div>
                 <div>
                    <button type="submit" className="bg-secondary-light text-text font-bold py-2 px-4 rounded hover:bg-border transition-colors">
                        Lưu thay đổi
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;