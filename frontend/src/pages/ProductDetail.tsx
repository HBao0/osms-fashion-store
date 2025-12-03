import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { Product, Review } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ProductDetailProps {
    productId: string;
    onBack: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// --- Sub-components for Reviews ---

interface StarRatingProps {
    rating: number;
    setRating?: (rating: number) => void;
    readOnly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, setRating, readOnly = false, size = 'md' }) => {
    const [hover, setHover] = useState(0);
    const starSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';

    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        type="button"
                        key={starValue}
                        className={`text-2xl ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        onClick={() => !readOnly && setRating && setRating(starValue)}
                        onMouseEnter={() => !readOnly && setHover(starValue)}
                        onMouseLeave={() => !readOnly && setHover(0)}
                        aria-label={`Rate ${starValue} stars`}
                    >
                        <svg className={`${starSize} ${starValue <= (hover || rating) ? 'text-yellow-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </button>
                );
            })}
        </div>
    );
};

const ReviewForm: React.FC<{ onSubmit: (rating: number, comment: string) => Promise<void> }> = ({ onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Vui lòng chọn số sao đánh giá.');
            return;
        }
        setIsSubmitting(true);
        await onSubmit(rating, comment);
        setIsSubmitting(false);
        setRating(0);
        setComment('');
    };

    return (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-secondary-light rounded-lg">
            <h3 className="font-semibold mb-2">Viết đánh giá của bạn</h3>
            <div className="mb-2">
                <StarRating rating={rating} setRating={setRating} />
            </div>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                className="w-full p-2 bg-background border border-border rounded"
                rows={4}
            />
            <button type="submit" disabled={isSubmitting} className="mt-2 bg-primary text-secondary font-bold py-2 px-4 rounded hover:bg-primary-dark disabled:bg-gray-500">
                {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </button>
        </form>
    );
};

const ReviewList: React.FC<{ reviews: Review[]; loading: boolean }> = ({ reviews, loading }) => {
    if (loading) return <div>Đang tải đánh giá...</div>;
    if (reviews.length === 0) return <p>Chưa có đánh giá nào cho sản phẩm này.</p>;

    return (
        <div className="space-y-6">
            {reviews.map(review => (
                <div key={review.id} className="flex items-start space-x-4">
                    <img src={review.userAvatar || 'https://via.placeholder.com/40'} alt={review.userName} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="font-semibold">{review.userName}</span>
                            <span className="text-xs text-text-light">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <StarRating rating={review.rating} readOnly={true} size="sm" />
                        <p className="mt-1 text-text-light">{review.comment}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- Main ProductDetail Component ---

const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onBack }) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState<string>('');
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);

    const { addToCart } = useCart();
    const { currentUser } = useAuth();

    useEffect(() => {
        const fetchProductData = async () => {
            try {
                setLoading(true);
                const fetchedProduct = await api.getProductById(productId);
                setProduct(fetchedProduct);
                if (fetchedProduct.images.length > 0) {
                    setMainImage(fetchedProduct.images[0]);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch product details.');
            } finally {
                setLoading(false);
            }
        };
        fetchProductData();
    }, [productId]);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setReviewsLoading(true);
                const fetchedReviews = await api.getReviews(productId);
                setReviews(fetchedReviews);
            } catch (err) {
                console.error('Failed to fetch reviews', err);
            } finally {
                setReviewsLoading(false);
            }
        };
        fetchReviews();
    }, [productId]);

    const handleReviewSubmit = async (rating: number, comment: string) => {
        try {
            const newReview = await api.submitReview(productId, { rating, comment });
            if(comment&&(comment.length < 20||comment.length>1000)){ 
                toast.error('Đánh giá phải từ 20 đến 1000 ký tự.');
                return;
            }
            setReviews([newReview, ...reviews]); // Add new review to the top
            
            // Refetch the product to update its average rating on the page
            const updatedProduct = await api.getProductById(productId);
            setProduct(updatedProduct);

            toast.success('Cảm ơn bạn đã đánh giá!');
        } catch (error: any) {
            toast.error(error.message || 'Gửi đánh giá thất bại.');
        }
    };


    if (loading) return <div className="text-center">Đang tải chi tiết sản phẩm...</div>;
    if (error) return <div className="text-center text-red-500">{error}</div>;
    if (!product) return <div className="text-center">Không tìm thấy sản phẩm.</div>;

    return (
        <div>
            <button onClick={onBack} className="mb-6 text-primary hover:underline">&larr; Quay lại cửa hàng</button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <img src={"https://placehold.co/600x400/orange/white?text=Product"} alt={product.name} className="w-full h-auto object-cover rounded-lg shadow-lg mb-4"/>
                    <div className="grid grid-cols-4 gap-2">
                        {product.images.map((img, index) => (
                            <img 
                                key={index} 
                                src={"https://placehold.co/600x400/orange/white?text=Product+" + (index + 1)} 
                                alt={`${product.name} thumbnail ${index + 1}`}
                                className={`w-full h-24 object-cover rounded cursor-pointer ${mainImage === img ? 'ring-2 ring-primary' : ''}`}
                                onClick={() => setMainImage(img)}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                    <div className="flex items-center mb-4">
                        <StarRating rating={product.rating} readOnly={true} />
                        <span className="text-text-light ml-2">({reviews.length} đánh giá)</span>
                    </div>
                    <div className="flex items-baseline mb-4">
                        <p className="text-3xl font-bold text-primary">{formatCurrency(product.finalPrice)}</p>
                        {product.discount > 0 && (
                            <p className="text-lg text-text-light line-through ml-3">{formatCurrency(product.price)}</p>
                        )}
                    </div>
                    <p className="text-text-light mb-6">{product.description}</p>
                    
                    <div className="flex items-center space-x-4 mb-6">
                        <label htmlFor="quantity">Số lượng:</label>
                        <input 
                            type="number"
                            id="quantity"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-20 p-2 bg-secondary-light rounded text-center"
                        />
                    </div>

                    <button 
                        onClick={() => addToCart(product, quantity)}
                        className="w-full bg-primary text-secondary font-bold py-3 px-6 rounded hover:bg-primary-dark transition-colors"
                    >
                        Thêm vào giỏ hàng
                    </button>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
                <h2 className="text-2xl font-bold mb-6">Đánh giá sản phẩm</h2>
                {currentUser && (
                    <ReviewForm onSubmit={handleReviewSubmit} />
                )}
                <ReviewList reviews={reviews} loading={reviewsLoading} />
            </div>
        </div>
    );
};

export default ProductDetail;