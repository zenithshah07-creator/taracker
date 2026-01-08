import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    Plus,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    Trash2,
    Edit2,
    MoreVertical,
    TrendingUp,
    Coffee
} from 'lucide-react';

export default function Logs() {
    const [logs, setLogs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingLogId, setEditingLogId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        topic: '',
        hours: '',
        status: 'completed',
        notes: ''
    });

    const fetchLogs = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/logs`);
            setLogs(res.data);
        } catch (err) {
            console.error('Fetch logs error:', err);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        const loadLogs = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/logs`, {
                    signal: controller.signal
                });
                setLogs(res.data);
            } catch (err) {
                if (err.name !== 'CanceledError') {
                    console.error('Initial fetch error:', err);
                }
            }
        };

        loadLogs();
        return () => controller.abort();
    }, []); // Run once on mount

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLogId) {
                await axios.patch(`${API_BASE_URL}/api/logs/${editingLogId}`, formData);
            } else {
                await axios.post(`${API_BASE_URL}/api/logs`, formData);
            }
            resetForm();
            fetchLogs();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this log?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/logs/${id}`);
            fetchLogs();
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleStatus = async (log) => {
        const newStatus = log.status === 'completed' ? 'pending' : 'completed';
        try {
            await axios.patch(`${API_BASE_URL}/api/logs/${log.id}`, { status: newStatus });
            fetchLogs();
        } catch (err) {
            console.error('Update status error:', err);
        }
    };

    const startEdit = (log) => {
        setEditingLogId(log.id);
        setFormData({
            date: log.date,
            topic: log.topic,
            hours: log.hours,
            status: log.status,
            notes: log.notes || ''
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingLogId(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            topic: '',
            hours: '',
            status: 'completed',
            notes: ''
        });
    };

    // Derived Data
    const today = new Date().toISOString().split('T')[0];
    const todayHours = logs
        .filter(log => log.date === today)
        .reduce((sum, log) => sum + parseFloat(log.hours || 0), 0);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Daily Study Logs</h1>
                    <p className="text-gray-500 mt-1">Review your consistency and study history.</p>
                </div>
                <button
                    onClick={() => { editingLogId ? resetForm() : setShowForm(!showForm) }}
                    className={`${showForm ? 'bg-gray-100 text-gray-600' : 'bg-indigo-600 text-white'} px-6 py-2.5 rounded-xl font-bold flex items-center shadow-lg transition-all active:scale-95`}
                >
                    {showForm ? 'Cancel' : <><Plus size={18} className="mr-2" /> Add Log</>}
                </button>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-3xl text-white flex items-center gap-4 shadow-xl shadow-indigo-100">
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-indigo-100 text-sm font-medium">Hours Today</p>
                        <h3 className="text-3xl font-black">{todayHours} hrs</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center gap-4 shadow-sm">
                    <div className="bg-green-50 text-green-600 p-3 rounded-2xl">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Completed Logs</p>
                        <h3 className="text-3xl font-black text-gray-800">{logs.filter(l => l.status === 'completed').length}</h3>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            {showForm && (
                <div className="animate-in zoom-in duration-300">
                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50 ring-4 ring-indigo-50/50">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            {editingLogId ? <Edit2 size={20} className="text-indigo-600" /> : <Plus size={20} className="text-indigo-600" />}
                            {editingLogId ? 'Edit Study Log' : 'Log New Session'}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Date</label>
                                <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 p-3" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Hours Studied</label>
                                <input type="number" step="0.5" name="hours" required value={formData.hours} onChange={handleChange} placeholder="0.0" className="w-full bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 p-3" />
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-600 mb-2">Topic / Area of Study</label>
                            <input type="text" name="topic" required value={formData.topic} onChange={handleChange} placeholder="e.g. Mastered Deep Context API" className="w-full bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 p-3" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 p-3 appearance-none">
                                    <option value="completed">✅ Fully Completed</option>
                                    <option value="pending">⏳ Still in Progress</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">Notes (Internal Thoughts)</label>
                                <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="What was the breakthrough?" className="w-full bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 p-3" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={resetForm} className="px-6 py-3 text-gray-500 font-bold hover:text-gray-800 transition-colors">Discard</button>
                            <button type="submit" className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">
                                {editingLogId ? 'Update Log' : 'Save Session'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filter & Search Section */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search logs and notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${statusFilter === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}>All</button>
                    <button onClick={() => setStatusFilter('completed')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${statusFilter === 'completed' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}>Completed</button>
                    <button onClick={() => setStatusFilter('pending')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${statusFilter === 'pending' ? 'bg-orange-100 text-orange-700' : 'text-gray-500 hover:bg-gray-50'}`}>Pending</button>
                </div>
            </div>

            {/* Logs List */}
            <div className="space-y-4">
                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                    <div key={log.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-md transition-all group">
                        <div className="flex items-start gap-4">
                            <div className={`p-4 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110 ${log.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                {log.status === 'completed' ? <CheckCircle size={24} /> : <Coffee size={24} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-gray-900 leading-tight">{log.topic}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${log.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {log.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-gray-500">
                                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-gray-400" /> {log.hours} hours</span>
                                </div>
                                {log.notes && <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-2 rounded-lg border-l-2 border-indigo-200 inline-block italic">"{log.notes}"</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 sm:mt-0 ml-14 sm:ml-0 overflow-hidden">
                            {log.status === 'pending' && (
                                <button
                                    onClick={() => handleToggleStatus(log)}
                                    className="p-2.5 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                    title="Mark as Completed"
                                >
                                    <CheckCircle size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => startEdit(log)}
                                className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Edit Log"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(log.id)}
                                className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Delete Log"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="bg-gray-50 p-12 rounded-3xl text-center border-2 border-dashed border-gray-200">
                        <Coffee className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-gray-700">No logs found</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">Try adjusting your filters or start a new study session!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
