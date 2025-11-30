import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Category, Filters, SortBy } from '../types';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../contexts/CartContext';

interface FilterPanelProps {
    onApply: (filters: Filters) => void;
    onCancel: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApply, onCancel }) => {
    const [localFilters, setLocalFilters] = useState<Filters>({});
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    
    // Static data for demonstration
    const filterOptions = {
        'style': { name: 'Phong cách', options: ['Công sở', 'Dạo phố', 'Dự tiệc'] },
        'color': { name: 'Màu sắc', options: ['Đen', 'Trắng', 'Xanh', 'Đỏ', 'Vàng'] },
        'productType': { name: 'Loại Sản Phẩm', options: ['Đầm', 'Áo', 'Váy', 'Quần', 'Jumpsuit', 'Giày cao gót', 'Giày xăng đan'] },
        'size': { name: 'Kích cỡ', options: ['S', 'M', 'L', 'XL'] },
        'heelHeight': { name: 'Độ cao', options: ['Bệt', '3cm', '5cm', '7cm+'] },
    };

    const handleCheckboxChange = (filterKey: keyof Filters, value: string) => {
        setLocalFilters(prev => {
            const currentValues = prev[filterKey] || [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            
            // If the array is empty, remove the key from the filters object
            if (newValues.length === 0) {
                const { [filterKey]: _, ...rest } = prev;
                return rest;
            }
            
            return { ...prev, [filterKey]: newValues };
        });
    };

    const handleApplyClick = () => {
        onApply(localFilters);
        setOpenDropdown(null);
    };

    const handleCancelClick = () => {
        setLocalFilters({});
        onCancel();
        setOpenDropdown(null);
    };

    return (
        <div className="p-4 bg-secondary border border-border rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(filterOptions).map(([key, { name, options }]) => (
                    <div key={key} className="relative">
                        <button 
                            onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
                            className="w-full flex justify-between items-center p-2 bg-background border border-border rounded"
                        >
                            <span>{name}</span>
                             <svg className={`w-4 h-4 transition-transform ${openDropdown === key ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {openDropdown === key && (
                             <div className="absolute top-full left-0 mt-2 w-60 bg-background border border-border rounded-lg shadow-lg z-10 p-4">
                                {options.map(opt => (
                                    <label key={opt} className="flex items-center space-x-2 p-1 hover:bg-secondary-light rounded">
                                        <input 
                                            type="checkbox" 
                                            className="form-checkbox bg-background border-border text-primary focus:ring-primary"
                                            checked={localFilters[key as keyof Filters]?.includes(opt) || false}
                                            onChange={() => handleCheckboxChange(key as keyof Filters, opt)}
                                        />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
             <div className="flex justify-end items-center mt-4 gap-4">
                 <button onClick={handleCancelClick} className="text-text-light hover:text-primary">Hủy</button>
                 <button onClick={handleApplyClick} className="bg-primary text-background font-bold py-2 px-6 rounded">Áp dụng</button>
            </div>
        </div>
    );
};


interface StoreProps {
    products: Product[];
    isLoading: boolean;
    onProductClick: (productId: string) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    categories: Category[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    filters: Filters;
    onFilterChange: (filters: Filters) => void;
    sortBy: SortBy;
    onSortChange: (sortBy: SortBy) => void;
}

export const Store: React.FC<StoreProps> = ({ 
    products, isLoading, onProductClick, currentPage, totalPages, onPageChange,
    onFilterChange, onSortChange, sortBy
}) => {
    const { addToCart } = useCart();
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<number | null>(null);
    const [isHovering, setIsHovering] = useState(false);


    const flashSaleProducts = useMemo(() => products.filter(p => p.isFlashSale), [products]);
    const newProducts = useMemo(() => products.filter(p => !p.isFlashSale), [products]);
    const doubledFlashSaleProducts = useMemo(() => [...flashSaleProducts, ...flashSaleProducts], [flashSaleProducts]);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;

        const startScrolling = () => {
            if (isHovering || !scrollContainer) return;

            scrollIntervalRef.current = window.setInterval(() => {
                const isAtEnd = scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2;
                if (isAtEnd) {
                    scrollContainer.scrollLeft = 0;
                } else {
                    scrollContainer.scrollLeft += 1;
                }
            }, 25); // Lower interval for smoother scroll
        };

        const stopScrolling = () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
                scrollIntervalRef.current = null;
            }
        };

        startScrolling();

        return () => stopScrolling();
    }, [isHovering, flashSaleProducts]);


    const ProductGrid = ({ productList }: { productList: Product[] }) => {
        if (isLoading) {
             // Show a skeleton loader grid
            return <>
                {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="bg-secondary rounded-lg h-96 animate-pulse"></div>
                ))}
            </>
        }

        if (!productList || productList.length === 0) {
            return <div className="text-center p-10 col-span-full">Không tìm thấy sản phẩm nào phù hợp.</div>
        }

        return (
            <>
                {productList.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={addToCart}
                        onProductClick={onProductClick}
                    />
                ))}
            </>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-12">
            {doubledFlashSaleProducts.length > 0 && !isLoading && (
                <section>
                    <h2 className="text-3xl font-bold mb-6">FLASH SALE</h2>
                    <div 
                        className="relative"
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        <div 
                           ref={scrollContainerRef}
                           className="flex space-x-6 overflow-x-hidden pb-4"
                        >
                            {doubledFlashSaleProducts.map((product, index) => (
                                <div key={`${product.id}-${index}`} className="flex-shrink-0 w-80">
                                    <ProductCard 
                                        product={product} 
                                        onAddToCart={addToCart}
                                        onProductClick={onProductClick}
                                        isFlashSale={true}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold">Top Sản Phẩm Mới Nhất</h2>
                        <p className="text-text-light">{products.length} sản phẩm</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="flex items-center gap-2 p-2 border border-border rounded hover:border-primary">
                            <span>Bộ lọc</span>
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M10 20h4" /></svg>
                        </button>
                        <select 
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value as SortBy)}
                            className="p-2 bg-secondary border border-border rounded focus:outline-none focus:border-primary"
                        >
                            <option value="default">Mặc định</option>
                            <option value="price_asc">Giá: Tăng dần</option>
                            <option value="price_desc">Giá: Giảm dần</option>
                            <option value="newest">Mới nhất</option>
                        </select>
                    </div>
                </div>

                {isFilterOpen && <FilterPanel onApply={onFilterChange} onCancel={() => onFilterChange({})} />}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-6">
                    <ProductGrid productList={newProducts} />
                </div>
                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                )}
            </section>
        </div>
    );
};


interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    let startPage: number, endPage: number;
    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
        const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
        if (currentPage <= maxPagesBeforeCurrent) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - maxPagesBeforeCurrent;
            endPage = currentPage + maxPagesAfterCurrent;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }
    
    return (
        <nav className="flex justify-center items-center space-x-2 mt-12" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded bg-secondary-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-light/80 transition-colors"
            >
                &larr; Trước
            </button>

            {startPage > 1 && (
                <>
                    <button onClick={() => onPageChange(1)} className="px-4 py-2 rounded transition-colors hover:bg-primary hover:text-background">1</button>
                    {startPage > 2 && <span className="px-4 py-2 text-text-light">...</span>}
                </>
            )}

            {pageNumbers.map(number => (
                <button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`px-4 py-2 rounded transition-colors ${currentPage === number ? 'bg-primary text-background font-bold' : 'hover:bg-primary hover:text-background'}`}
                    aria-current={currentPage === number ? 'page' : undefined}
                >
                    {number}
                </button>
            ))}

            {endPage < totalPages && (
                 <>
                    {endPage < totalPages - 1 && <span className="px-4 py-2 text-text-light">...</span>}
                    <button onClick={() => onPageChange(totalPages)} className="px-4 py-2 rounded transition-colors hover:bg-primary hover:text-background">{totalPages}</button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded bg-secondary-light disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-light/80 transition-colors"
            >
                Sau &rarr;
            </button>
        </nav>
    );
};