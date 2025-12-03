import React, { useState } from 'react';
import { Product } from '../../types';
import ProductEditModal from './ProductEditModal';

interface ProductManagementProps {
    products: Product[];
    onSave: (product: Partial<Product>) => void;
    onDelete: (productId: string) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const ProductManagement: React.FC<ProductManagementProps> = ({ products, onSave, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [query, setQuery] = useState('');

    const filteredProducts = products.filter(p => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
    });

    const handleOpenModal = (product: Partial<Product> | null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleSave = (product: Partial<Product>) => {
        onSave(product);
        handleCloseModal();
    };

    return (
        <div>
            <div className="flex items-center mb-6">
                <h2 className="text-2xl font-bold">{`Danh sách sản phẩm (${filteredProducts.length})`}</h2>
                <div className="flex-1 mx-6">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm kiếm sản phẩm, danh mục, SKU..."
                        className="w-full p-2 bg-background border border-border rounded"
                    />
                </div>
                <button 
                    onClick={() => handleOpenModal({ name: 'Sản phẩm mới', price: 0, discount: 0, stock: 0, images: [], colors: [], sizes: [] })} 
                    className="bg-primary text-background font-bold py-2 px-4 rounded hover:bg-primary-dark transition-colors"
                >
                    Thêm mới
                </button>
            </div>
             <div className="rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-secondary-light/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Sản phẩm</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Danh mục</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Giá</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Tồn kho</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-border">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="hover:bg-secondary-light/40 transition-colors duration-150">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-text">{product.name}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text-light">{product.category}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-primary">{formatCurrency(product.finalPrice)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-text-light">{product.stock}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <button onClick={() => handleOpenModal(product)} className="text-primary hover:underline mr-4 font-medium">Sửa</button>
                                        <button onClick={() => onDelete(product.id)} className="text-red-500 hover:underline font-medium">Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <ProductEditModal 
                    product={editingProduct}
                    onSave={handleSave}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default ProductManagement;