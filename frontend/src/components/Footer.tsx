import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-secondary mt-auto">
            <div className="container mx-auto px-4 py-6 text-center text-text-light">
                <p>&copy; {new Date().getFullYear()} OSMS Fashion Store. All Rights Reserved.</p>
            </div>
        </footer>
    );
};
