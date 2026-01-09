import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    History as HistoryIcon,
    CheckCircle,
    BookOpen,
    Calendar,
    Clock,
    ChevronRight,
    Search,
    Filter,
    Coffee,
    Terminal,
    Plus,
    PlusCircle,
    Rocket,
    Target
} from 'lucide-react';

export default function History() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, study, task

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const [logsRes, todosRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/logs`),
                axios.get(`${API_BASE_URL}/api/todos`)
            ]);

            // Process Logs
            const logActivities = logsRes.data.map(log => {
                const timestamp = log.created_at ? new Date(log.created_at).getTime() : new Date(log.date).getTime();
                return {
                    id: `log-${log.id}`,
                    type: 'study',
                    title: log.topic,
                    subtitle: `${log.hours} hours studied`,
                    date: log.date,
                    timestamp,
                    notes: log.notes,
                    status: log.status,
                    events: (() => {
                        try {
                            return (log.events && typeof log.events === 'string') ? JSON.parse(log.events) : [];
                        } catch (e) {
                            console.error("Error parsing events for log", log.id, e);
                            return [];
                        }
                    })()
                };
            });

            // Process Todos (Added & Completed events)
            const todoActivities = [];
            todosRes.data.forEach(todo => {
                // 1. Added Event
                if (todo.created_at) {
                    todoActivities.push({
                        id: `todo-add-${todo.id}`,
                        type: 'task-add',
                        title: todo.source === 'pdf' ? `Roadmap Task Added` : `New Task Added`,
                        subtitle: todo.task,
                        date: todo.created_at.split('T')[0],
                        timestamp: new Date(todo.created_at).getTime(),
                        details: todo.details,
                        source: todo.source,
                        section: todo.section,
                        priority: todo.priority,
                        due_date: todo.due_date
                    });
                }

                // 2. Completed Event
                if (todo.is_completed === 1 && todo.completed_at) {
                    todoActivities.push({
                        id: `todo-done-${todo.id}`,
                        type: 'task-done',
                        title: `Goal Achieved`,
                        subtitle: todo.task,
                        date: todo.completed_at.split('T')[0],
                        timestamp: new Date(todo.completed_at).getTime(),
                        details: todo.details,
                        source: todo.source,
                        section: todo.section,
                        priority: todo.priority,
                        due_date: todo.due_date
                    });
                }
            });

            // Combine and Sort
            const combined = [...logActivities, ...todoActivities].sort((a, b) => b.timestamp - a.timestamp);
            setActivities(combined);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const filteredActivities = activities.filter(act => {
        const matchesSearch =
            act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            act.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (act.notes && act.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (act.details && act.details.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesType =
            typeFilter === 'all' ||
            (typeFilter === 'study' && act.type === 'study') ||
            (typeFilter === 'task' && (act.type === 'task-add' || act.type === 'task-done'));

        return matchesSearch && matchesType;
    });

    // Grouping activities by date
    const groupedActivities = filteredActivities.reduce((groups, activity) => {
        const date = activity.date;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(activity);
        return groups; // group label might be today / yesterday for better UX
    }, {});

    const formatDateLabel = (dateStr) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (dateStr === today) return 'Today';
        if (dateStr === yesterday) return 'Yesterday';

        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
            <header className="bg-gradient-to-r from-indigo-700 to-indigo-900 -mx-6 -mt-6 p-12 rounded-b-[3rem] text-white shadow-2xl mb-12">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                            <HistoryIcon size={36} /> Activity History
                        </h1>
                        <p className="text-indigo-100 mt-2 text-lg font-medium opacity-80">Track every milestone on your path to mastery.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchHistory}
                            className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-all backdrop-blur-md border border-white/10"
                            title="Refresh Items"
                        >
                            <Clock size={24} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search history..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${typeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setTypeFilter('study')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${typeFilter === 'study' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        Study
                    </button>
                    <button
                        onClick={() => setTypeFilter('task')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${typeFilter === 'task' ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                    >
                        Tasks
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100">
                {Object.keys(groupedActivities).length > 0 ? Object.keys(groupedActivities).sort((a, b) => b.localeCompare(a)).map(dateKey => (
                    <div key={dateKey} className="space-y-6">
                        <div className="relative z-10">
                            <h2 className="bg-white inline-block pr-4 text-sm font-black text-indigo-600 uppercase tracking-widest ml-12">
                                {formatDateLabel(dateKey)}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {groupedActivities[dateKey].map((activity) => (
                                <div key={activity.id} className="relative group pl-12">
                                    {/* Timeline Marker */}
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-125 
                                        ${activity.type === 'study' ? 'bg-amber-400' :
                                            activity.type === 'task-add' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></div>

                                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl 
                                                ${activity.type === 'study' ? 'bg-amber-50 text-amber-600' :
                                                    activity.type === 'task-add' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {activity.type === 'study' ? <BookOpen size={24} /> :
                                                    activity.type === 'task-add' ? (activity.source === 'pdf' ? <Rocket size={24} /> : <PlusCircle size={24} />) :
                                                        <CheckCircle size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 tracking-tight">{activity.title}</h3>
                                                <p className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                                    {activity.subtitle}
                                                    {activity.type === 'study' && activity.status === 'completed' && (
                                                        <span className="bg-green-100 text-green-700 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase">Finished</span>
                                                    )}
                                                </p>
                                                {activity.section && (
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Target size={10} className="text-gray-400" />
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activity.section}</span>
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    {activity.priority && (
                                                        <span className={`px-2 py-0.5 text-[8px] font-black border rounded-full uppercase tracking-tighter ${activity.priority === 'High' ? 'text-rose-600 bg-rose-50 border-rose-100' :
                                                            activity.priority === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                                                'text-emerald-600 bg-emerald-50 border-emerald-100'
                                                            }`}>
                                                            {activity.priority}
                                                        </span>
                                                    )}
                                                    {activity.due_date && activity.type === 'task-add' && (
                                                        <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                                            Due: {new Date(activity.due_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                {(activity.notes || activity.details) && (
                                                    <p className="text-xs text-gray-400 mt-2 italic">
                                                        "{activity.notes || activity.details}"
                                                    </p>
                                                )}

                                                {/* Session Events Timeline */}
                                                {activity.events && activity.events.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-gray-50 bg-gray-50/50 rounded-2xl p-3">
                                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                                                            <Terminal size={10} /> Session Lifecycle
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {activity.events.slice().reverse().map((ev, idx) => (
                                                                <div key={idx} className="flex items-center gap-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${ev.type === 'Started' ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                                                                    <span className="text-[10px] font-mono text-gray-400">[{ev.time}]</span>
                                                                    <span className="text-[10px] font-bold text-gray-600">{ev.type}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block 
                                                ${activity.type === 'study' ? 'bg-amber-100 text-amber-700' :
                                                    activity.type === 'task-add' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {activity.type === 'study' ? 'Study Log' :
                                                    activity.type === 'task-add' ? 'Planning' : 'Success'}
                                            </p>
                                            <p className="text-xs font-bold text-gray-400 mt-1.5 flex items-center justify-end gap-1">
                                                <Clock size={12} />
                                                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )) : (
                    <div className="bg-gray-50 p-16 rounded-3xl text-center border-2 border-dashed border-gray-200 ml-12">
                        <Coffee className="mx-auto text-gray-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-gray-700">The past is a clean slate</h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">Start completing tasks or logging your study sessions to build your history!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
