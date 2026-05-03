import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'Employee', baseSalary: 0, shiftStartTime: '09:00', shiftEndTime: '17:00'
    });
    const { user } = useContext(AuthContext);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (error) {
            console.error('Failed to fetch employees', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/employees', formData);
            setShowModal(false);
            fetchEmployees();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create employee');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this employee?')) {
            try {
                await api.delete(`/employees/${id}`);
                fetchEmployees();
            } catch (error) {
                alert('Failed to delete');
            }
        }
    };

    if (loading) return <div>Loading employees...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Employees</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your organization's staff</p>
                </div>
                {user?.role === 'Admin' && (
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <Plus size={20} /> Add Employee
                    </button>
                )}
            </div>

            <div className="glass-panel table-container" style={{ padding: '24px' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Base Salary</th>
                            <th>Shift</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp._id}>
                                <td style={{ fontWeight: '500' }}>{emp.name}</td>
                                <td style={{ color: 'var(--text-muted)' }}>{emp.email}</td>
                                <td><span className="badge badge-Present">{emp.role}</span></td>
                                <td>৳ {emp.baseSalary}</td>
                                <td>{emp.shiftStartTime} - {emp.shiftEndTime}</td>
                                <td>
                                    {user?.role === 'Admin' && emp.role !== 'Admin' && (
                                        <button onClick={() => handleDelete(emp._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <div className="glass-panel animate-fade-in" style={{ padding: '32px', width: '100%', maxWidth: '500px', marginTop: '50px', marginBottom: '50px' }}>
                        <h2 style={{ marginBottom: '24px' }}>Create New Employee</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input type="text" placeholder="Full Name" className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <input type="email" placeholder="Email Address" className="input-field" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            <input type="password" placeholder="Temporary Password" className="input-field" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Role</label>
                                    <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                        <option value="Employee">Employee</option>
                                        <option value="HR">HR</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Base Salary (৳)</label>
                                    <input type="number" className="input-field" required value={formData.baseSalary} onChange={e => setFormData({...formData, baseSalary: e.target.value})} />
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Shift Start</label>
                                    <input type="time" className="input-field" required value={formData.shiftStartTime} onChange={e => setFormData({...formData, shiftStartTime: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Shift End</label>
                                    <input type="time" className="input-field" required value={formData.shiftEndTime} onChange={e => setFormData({...formData, shiftEndTime: e.target.value})} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Employees;
