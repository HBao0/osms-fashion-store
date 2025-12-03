import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';

interface ProductEditModalProps {
    product: Partial<Product> | null;
    onSave: (product: Partial<Product>) => void;
    onClose: () => void;
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({ product, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Product>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (product) {
            setFormData({
                ...product,
                images: product.images || [],
                colors: product.colors || [],
                sizes: product.sizes || [],
            });
        }
    }, [product]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'colors' | 'sizes') => {
        const value = e.target.value.split(',').map(item => item.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const filesArray = Array.from(files);
            const readers = filesArray.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readers).then(base64Images => {
                setFormData(prev => ({
                    ...prev,
                    images: [...(prev.images || []), ...base64Images],
                }));
            });
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images?.filter((_, i) => i !== index)
        }));
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalPrice = (formData.price || 0) * (1 - (formData.discount || 0) / 100);
        onSave({ ...formData, finalPrice: Math.round(finalPrice) });
    };
    
    const modalTitle = product && product.id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới';

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
            onClick={onClose}
        >
            <div 
                className="bg-secondary p-6 rounded-lg shadow-xl w-full max-w-4xl border border-border max-h-[90vh] overflow-y-auto"
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
                            <Input label="Tên sản phẩm" name="name" value={formData.name} onChange={handleChange} required />
                            <Textarea label="Mô tả" name="description" value={formData.description} onChange={handleChange} />
                            <Input label="Danh mục" name="category" value={formData.category} onChange={handleChange} />
                            <Input label="Phong cách" name="style" value={formData.style} onChange={handleChange} />
                            <Input label="SKU" name="sku" value={formData.sku} onChange={handleChange} />
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <Input label="Giá gốc" name="price" type="number" value={formData.price} onChange={handleChange} required />
                                <Input label="Giảm giá (%)" name="discount" type="number" value={formData.discount} onChange={handleChange} />
                                <Input label="Tồn kho" name="stock" type="number" value={formData.stock} onChange={handleChange} required />
                            </div>
                            <Input label="Đánh giá" name="rating" type="number" step="0.1" value={formData.rating} onChange={handleChange} />
                            <Input label="Màu sắc (phân cách bằng dấu phẩy)" name="colors" value={formData.colors?.join(', ')} onChange={e => handleArrayChange(e, 'colors')} />
                            <Input label="Kích cỡ (phân cách bằng dấu phẩy)" name="sizes" value={formData.sizes?.join(', ')} onChange={e => handleArrayChange(e, 'sizes')} />
                             <div>
                                <label className="block text-sm font-medium text-text-light mb-1">Hình ảnh sản phẩm</label>
                                <div className="p-2 bg-background border border-border rounded grid grid-cols-4 gap-2 min-h-[8rem]">
                                    {formData.images?.map((img, index) => (
                                        <div key={index} className="relative group">
                                            <img src={img} alt={`Product image ${index + 1}`} className="w-full h-24 object-cover rounded" />
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remove image"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        type="button" 
                                        onClick={triggerFileSelect} 
                                        className="w-full h-24 border-2 border-dashed border-border rounded flex items-center justify-center text-text-light hover:bg-border/20"
                                    >
                                        Thêm ảnh
                                    </button>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleFilesChange} className="hidden" accept="image/*" multiple />
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


// Helper components for inputs to reduce repetition
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
}
const Input: React.FC<InputProps> = ({ label, name, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-text-light">{label}</label>
        <input 
            name={name}
            id={name}
            className="mt-1 w-full p-2 bg-background border border-border rounded"
            {...props}
        />
    </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}
const Textarea: React.FC<TextareaProps> = ({ label, name, ...props }) => (
     <div>
        <label className="block text-sm font-medium text-text-light">{label}</label>
        <textarea
            name={name}
            id={name}
            rows={3}
            className="mt-1 w-full p-2 bg-background border border-border rounded"
            {...props}
        />
    </div>
)


export default ProductEditModal;