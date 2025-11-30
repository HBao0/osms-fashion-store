import React from 'react';
import { Category } from '../types';

interface CategorySidebarProps {
    categories: Category[];
    selectedCategory: string;
    onSelectCategory: (categoryName: string) => void;
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({ categories, selectedCategory, onSelectCategory }) => {
    const totalProducts = categories.reduce((sum, cat) => sum + Number(cat.count), 0);

    const baseStyle = "w-full text-left px-4 py-2 rounded transition-colors duration-200 flex justify-between items-center";
    const inactiveStyle = "hover:bg-secondary-light";
    const activeStyle = "bg-primary text-secondary font-bold";
    
    return (
        <aside className="w-full md:w-64 flex-shrink-0">
            <h2 className="text-xl font-bold mb-4">Danh mục</h2>
            <nav className="flex flex-col space-y-2">
                 <button
                    onClick={() => onSelectCategory('all')}
                    className={`${baseStyle} ${selectedCategory === 'all' ? activeStyle : inactiveStyle}`}
                    aria-pressed={selectedCategory === 'all'}
                >
                    <span>Tất cả sản phẩm</span>
                    <span className="text-xs font-normal opacity-75">{totalProducts}</span>
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.name}
                        onClick={() => onSelectCategory(cat.name)}
                        className={`${baseStyle} ${selectedCategory === cat.name ? activeStyle : inactiveStyle}`}
                        aria-pressed={selectedCategory === cat.name}
                    >
                       <span>{cat.name}</span>
                       <span className="text-xs font-normal opacity-75">{cat.count}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};
