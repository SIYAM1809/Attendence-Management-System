import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Users, UserCheck, UserX, ClockAlert } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `rgba(${color}, 0.1)`, color: `rgb(${color})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={30} />
        </div>
        <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>{title}</p>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{value}</h3>
        </div>
    </div>
);

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/reports/dashboard');
                setStats(res.data);
            } catch (error) {
                console.error("Error fetching stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Admin Overview</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Welcome back, {user.name}. Here is the company status for today.</p>

            {stats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    <StatCard title="Total Employees" value={stats.totalEmployees} icon={Users} color="59, 130, 246" />
                    <StatCard title="Present Today" value={stats.presentCount} icon={UserCheck} color="16, 185, 129" />
                    <StatCard title="Absent Today" value={stats.absentCount} icon={UserX} color="239, 68, 68" />
                    <StatCard title="Late Today" value={stats.lateCount} icon={ClockAlert} color="245, 158, 11" />
                </div>
            ) : (
                <p>Unable to load statistics.</p>
            )}
            
            <div className="glass-panel" style={{ padding: '24px', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>Additional HR charts & reports can be placed here.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
