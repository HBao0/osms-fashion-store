import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as api from '../services/api';
import { AnalyticsData } from '../types';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const KPICard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-secondary-light p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-text-light uppercase">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-primary">{value}</p>
    </div>
);


const Analytics: React.FC = () => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const summaryData = await api.getAnalyticsSummary();
                setData(summaryData);
            } catch (err: any) {
                setError('Không thể tải dữ liệu báo cáo.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Đang tải dữ liệu...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!data) return <div>Không có dữ liệu để hiển thị.</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">Báo cáo kinh doanh</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard title="Tổng doanh thu" value={formatCurrency(data.totalRevenue)} />
                <KPICard title="Tổng đơn hàng" value={data.totalOrders} />
                <KPICard title="Đơn hàng mới" value={data.newOrders} />
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Doanh thu theo tháng</h2>
                <div className="w-full h-96 bg-secondary-light p-4 rounded-lg">
                    <ResponsiveContainer>
                        <LineChart
                            data={data.monthlyRevenue}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#D1D5DB" />
                            <YAxis stroke="#D1D5DB" tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(Number(value))} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                                labelStyle={{ color: '#F9FAFB' }}
                                formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']}
                             />
                            <Legend wrapperStyle={{color: '#F9FAFB'}}/>
                            <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#FBBF24" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
