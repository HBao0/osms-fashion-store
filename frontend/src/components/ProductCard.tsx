import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onProductClick: (productId: string) => void;
    onAddToCart: (product: Product) => void;
    isFlashSale?: boolean;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick, onAddToCart, isFlashSale = false }) => {
    const handleAddToCartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToCart(product);
    };
    
    return (
        <div 
            className="bg-secondary rounded-lg overflow-hidden border border-border shadow-lg hover:border-primary/50 transition-all duration-300 flex flex-col cursor-pointer group"
            onClick={() => onProductClick(product.id)}
            aria-label={`View details for ${product.name}`}
        >
            <div className="relative overflow-hidden">
                <img 
                    src={`https://placehold.co/600x400/orange/white?text=Products`} 
                    alt={product.name} 
                    className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
                {isFlashSale && (
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Flash Sale</span>
                )}
                 {product.discount > 0 && !isFlashSale &&(
                    <span className="absolute top-2 right-2 bg-primary text-background text-xs font-bold px-2 py-1 rounded-md">-{product.discount}%</span>
                )}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <p className="text-xs text-text-light mb-1">{product.category}</p>
                <h3 className="text-md font-semibold text-text truncate mb-2 h-12">{product.name}</h3>
                <div className="mt-auto">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                             <p className="text-lg font-bold text-primary">{formatCurrency(product.finalPrice)}</p>
                            {product.discount > 0 && (
                                <p className="text-sm text-text-light line-through">{formatCurrency(product.price)}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-yellow-400">
                             <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                             <span>{product.rating.toFixed(1)}</span>
                        </div>
                    </div>
                    
                    {isFlashSale && (
                        <>
                            <div className="flex items-center space-x-2 my-3">
                                {product.colors.slice(0, 4).map(color => (
                                    <span key={color} className="block w-5 h-5 rounded-full border-2 border-secondary-light" style={{ backgroundColor: color.toLowerCase() }} title={color}></span>
                                ))}
                            </div>
                            <button 
                                onClick={handleAddToCartClick}
                                className="w-full bg-transparent border-2 border-primary text-primary font-bold py-2 px-4 rounded hover:bg-primary hover:text-secondary transition-colors"
                                aria-label={`Add ${product.name} to cart`}
                            >
                                Thêm vào giỏ
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
