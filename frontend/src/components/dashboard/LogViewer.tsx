import React from 'react';
import { LogEntry } from '../../types';

interface LogViewerProps {
    logs: LogEntry[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Nhật ký hoạt động</h2>
            <div className="bg-secondary-light rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-background">
                        <thead className="bg-background">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Thời gian</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Tài khoản</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-background">
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{new Date(log.timestamp).toLocaleString('vi-VN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                                        <div>{log.userName}</div>
                                        <div className="text-xs text-text-light">{log.userEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{log.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LogViewer;
