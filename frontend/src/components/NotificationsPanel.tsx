import React, { useEffect } from 'react';
import { Notification } from '../types';

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAllAsRead: () => void;
    onClickNotification?: (n: Notification) => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, notifications, onMarkAllAsRead, onClickNotification }) => {
    if (!isOpen) return null;

    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}>
            <div 
                className="absolute top-20 right-4 sm:right-6 md:right-8 w-full max-w-sm bg-secondary rounded-lg shadow-xl border border-border"
                onClick={e => e.stopPropagation()}
                aria-modal="true"
                role="dialog"
                aria-labelledby="notifications-heading"
            >
                <div className="p-4 border-b border-secondary-light flex justify-between items-center">
                    <h2 id="notifications-heading" className="text-lg font-bold">Thông báo</h2>
                    {unreadCount > 0 && (
                        <button onClick={onMarkAllAsRead} className="text-sm text-primary hover:underline">
                            Đánh dấu tất cả đã đọc
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="p-6 text-center text-text-light">
                        <p>Bạn không có thông báo nào.</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto" role="list">
                        {notifications.map(notification => (
                            <button
                                key={notification.id}
                                type="button"
                                className={`w-full text-left p-4 border-b border-secondary-light flex items-start gap-3 transition-opacity ${notification.read ? 'opacity-60' : 'opacity-100'}`}
                                role="listitem"
                                onClick={() => onClickNotification && onClickNotification(notification)}
                            >
                                {!notification.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" aria-hidden="true"></div>}
                                <div className={notification.read ? 'pl-5' : ''}>
                                    <p className="font-semibold">{notification.title}</p>
                                    <p className="text-sm text-text-light">{notification.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};