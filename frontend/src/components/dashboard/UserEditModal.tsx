import React, { useState, useEffect, useRef } from 'react';
import PhoneInput from '../../components/PhoneInput';
import { User } from '../../types';

interface UserEditModalProps {
    user: Partial<User> | null;
    onSave: (user: Partial<User>) => void;
    onClose: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<User>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setFormData(user);
        } else {
            setFormData({ role: 'user' });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const modalTitle = user && user.id ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới';
    
    const birthDateValue = formData.birthDate ? formData.birthDate.split('T')[0] : '';


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
            onClick={onClose}
        >
            <div 
                className="bg-secondary p-6 rounded-lg shadow-xl w-full max-w-3xl border border-border"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">{modalTitle}</h2>
                    <button onClick={onClose} className="text-2xl text-text-light hover:text-primary">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-light">Tên người dùng</label>
                                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="mt-1 w-full p-2 bg-background border border-border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-light">Số điện thoại</label>
                                <PhoneInput name="phone" value={formData.phone} onChange={(v: string) => setFormData(prev => ({ ...prev, phone: v }))} placeholder="Nhập số điện thoại" className="mt-1 w-full" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-text-light">Ảnh đại diện</label>
                                <div className="mt-1 flex items-center gap-4">
                                    <img 
                                        src={formData.avatar || 'https://via.placeholder.com/80'} 
                                        alt="Avatar" 
                                        className="w-20 h-20 rounded-full object-cover bg-background"
                                    />
                                    <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                                    <button type="button" onClick={triggerFileSelect} className="bg-secondary-light px-4 py-2 rounded hover:bg-border">
                                        Tải ảnh lên
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-light">Mật khẩu mới</label>
                                <input 
                                  type="password" 
                                  name="password" 
                                  onChange={handleChange} 
                                  placeholder={user?.id ? "Để trống nếu không đổi" : "Bắt buộc"}
                                  className="mt-1 w-full p-2 bg-background border border-border rounded" 
                                  required={!user?.id}
                                />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-light">Email</label>
                                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 w-full p-2 bg-background border border-border rounded" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-light">Ngày sinh</label>
                                <input type="date" name="birthDate" value={birthDateValue} onChange={handleChange} className="mt-1 w-full p-2 bg-background border border-border rounded" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-light">Vai trò</label>
                                <select name="role" value={formData.role || 'user'} onChange={handleChange} className="mt-1 w-full p-2 bg-background border border-border rounded">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end items-center gap-4 pt-6">
                        <button type="button" onClick={onClose} className="py-2 px-6 rounded text-text-light hover:bg-secondary-light">
                            Hủy
                        </button>
                        <button type="submit" className="bg-primary text-secondary font-bold py-2 px-6 rounded hover:bg-primary-dark">
                            Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;