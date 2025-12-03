import React, { useState } from 'react';
import { User } from '../../types';
import UserEditModal from './UserEditModal';

interface UserManagementProps {
    users: User[];
    onSave: (user: Partial<User>) => void;
    onDelete: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
    const [query, setQuery] = useState('');

    const filteredUsers = users.filter(u => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    });

    const handleOpenModal = (user: Partial<User> | null) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSave = (user: Partial<User>) => {
        onSave(user);
        handleCloseModal();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Quản lý người dùng</h2>
                <div className="mx-4 flex-1 max-w-lg">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên hoặc email..." className="w-full p-2 bg-background border border-border rounded" />
                </div>
                 <button 
                    onClick={() => handleOpenModal({ role: 'user' })} 
                    className="bg-primary text-background font-bold py-2 px-4 rounded hover:bg-primary-dark transition-colors"
                 >
                    Thêm người dùng
                </button>
            </div>
            <div className="bg-background rounded-lg shadow overflow-hidden border border-border">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-secondary-light">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Tên</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Vai trò</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-text-light uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-secondary divide-y divide-border">
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                        <button onClick={() => handleOpenModal(user)} className="text-primary hover:underline mr-4">Sửa</button>
                                        <button onClick={() => onDelete(user.id)} className="text-red-500 hover:underline">Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <UserEditModal
                    user={editingUser}
                    onSave={handleSave}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default UserManagement;