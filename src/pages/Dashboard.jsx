import React, { useState, useEffect, useCallback } from 'react';
import Timer from '../components/Timer';
import axios from 'axios';
import { API_BASE_URL } from '../config';

import {
    Activity,
    Calendar,
    CheckCircle2,
    Clock,
    LayoutDashboard,
    ListTodo,
    TrendingUp
} from 'lucide-react';

export default function Dashboard({ onNavigate }) {
    const [summary, setSummary] = useState({ total_hours: 0, completed_topics: 0, pending_topics: 0 });
    const [recentActivities, setRecentActivities] = useState([]);
    const [upcomingTasks, setUpcomingTasks] = useState([]);
    const [tomorrowTasks, setTomorrowTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryRes, logsRes, todosRes] = await Promise.all([
                axios.get('http://localhost:3000/api/summary'),
                axios.get('http://localhost:3000/api/logs'),
                axios.get('http://localhost:3000/api/todos')
            ]);

            setSummary(summaryRes.data);

            // Process Recent Activity (Combine Logs and Recently Completed Todos)
            const logs = logsRes.data.map(log => ({
                id: `log-${log.id}`,
                type: 'study',
                title: log.topic,
                subtitle: `${log.hours} hrs • ${log.status}`,
                date: log.date,
                timestamp: new Date(log.date).getTime()
            }));

            const completedTodos = todosRes.data
                .filter(t => t.is_completed)
                .map(todo => ({
                    id: `todo-${todo.id}`,
                    type: 'task',
                    title: todo.task,
                    subtitle: 'Completed Task',
                    date: 'Today', // Backend doesn't have completion date yet, assuming recent
                    timestamp: Date.now()
                }));

            const combined = [...logs, ...completedTodos]
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5);

            setRecentActivities(combined);

            // Process Tomorrow's Tasks
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const forTomorrow = todosRes.data
                .filter(t => !t.is_completed && t.due_date === tomorrowStr);
            setTomorrowTasks(forTomorrow);

            // Process Upcoming Tasks (Focus on Today or next available)
            const pending = todosRes.data
                .filter(t => !t.is_completed && t.due_date !== tomorrowStr)
                .slice(0, 4);
            setUpcomingTasks(pending);

        } catch (err) {
            console.error('Dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse text-indigo-600 font-medium">Loading Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        <LayoutDashboard className="text-indigo-600" />
                        Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1">Here's what's happening with your goals.</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-500" />
                        <span className="text-sm font-medium text-gray-600">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Clock size={24} />}
                    label="Study Time"
                    value={`${summary.total_hours || 0}h`}
                    color="blue"
                    trend="+12% from last week"
                />
                <StatCard
                    icon={<CheckCircle2 size={24} />}
                    label="Completed"
                    value={summary.completed_topics || 0}
                    color="green"
                    trend="Top 10% of users"
                />
                <StatCard
                    icon={<ListTodo size={24} />}
                    label="Pending Tasks"
                    value={summary.pending_topics || 0}
                    color="amber"
                />
                <StatCard
                    icon={<TrendingUp size={24} />}
                    label="Success Rate"
                    value={`${Math.round((summary.completed_topics / (summary.completed_topics + summary.pending_topics || 1)) * 100)}%`}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timer & Focus Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Clock className="text-indigo-500" size={20} />
                                Focus Timer
                            </h3>
                        </div>
                        <Timer />
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Activity className="text-rose-500" size={20} />
                                Recent Activity
                            </h3>
                            <button
                                onClick={() => onNavigate('history')}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-all"
                            >
                                View All History
                            </button>
                        </div>
                        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                            {recentActivities.length > 0 ? recentActivities.map((activity) => (
                                <div key={activity.id} className="relative pl-8 group">
                                    <div className={`absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full border-4 border-white shadow-sm flex items-center justify-center ${activity.type === 'study' ? 'bg-blue-500' : 'bg-green-500'
                                        }`}>
                                        {activity.type === 'study' ? <Clock size={10} className="text-white" /> : <CheckCircle2 size={10} className="text-white" />}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors">{activity.title}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">{activity.subtitle}</p>
                                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">{activity.date}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 italic pl-4">No recent activity yet. Start studying!</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Upcoming & Progress */}
                <div className="space-y-8">
                    <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-indigo-100 font-medium mb-1">Your Progress</h3>
                            <div className="text-4xl font-black mb-4">Keep Going!</div>
                            <div className="w-full bg-indigo-500/50 rounded-full h-3 mb-2">
                                <div
                                    className="bg-white h-full rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (summary.completed_topics / (summary.completed_topics + summary.pending_topics || 1)) * 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-indigo-100">You've finished {summary.completed_topics} topics so far.</p>
                        </div>
                        <TrendingUp className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32" />
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <ListTodo className="text-indigo-500" size={20} />
                            Upcoming Tasks
                        </h3>
                        <div className="space-y-4">
                            {upcomingTasks.length > 0 ? upcomingTasks.map((task) => (
                                <div key={task.id} className="p-4 rounded-2xl border border-gray-50 bg-gray-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
                                    <div className="flex gap-4">
                                        <div className={`w-1 font-black rounded-full transition-colors ${task.priority === 'High' ? 'bg-rose-500' :
                                            task.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}></div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <h4 className="text-sm font-black text-gray-800 line-clamp-1">{task.task}</h4>
                                                {task.priority === 'High' && <span className="text-[8px] font-black bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">High</span>}
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{task.format || 'Study'}</p>
                                                {task.due_date && (
                                                    <div className="flex items-center gap-1 text-slate-400">
                                                        <Clock size={10} />
                                                        <span className="text-[10px] font-bold">{new Date(task.due_date).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 italic">No pending tasks. Great job!</p>
                            )}
                            <button
                                onClick={() => onNavigate('roadmap')}
                                className="w-full py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-dashed border-indigo-200 mt-2"
                            >
                                View Full Roadmap
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <Calendar className="text-rose-500" size={20} />
                            Tomorrow's Agenda
                        </h3>
                        <div className="space-y-4">
                            {tomorrowTasks.length > 0 ? tomorrowTasks.map((task) => (
                                <div key={task.id} className="p-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/30 group">
                                    <div className="flex gap-3">
                                        <div className="w-1 bg-gray-200 rounded-full"></div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-500 line-clamp-1">{task.task}</h4>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1 italic">Strategically Planned</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 italic">No missions planned for tomorrow yet.</p>
                            )}
                            <button
                                onClick={() => onNavigate('todo')}
                                className="w-full py-3 text-xs font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-colors mt-2 border border-rose-100 hover:border-transparent"
                            >
                                Plan Tomorrow
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, trend }) {
    const colors = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        amber: 'text-amber-600 bg-amber-50',
        purple: 'text-purple-600 bg-purple-50'
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className={`p-3 rounded-2xl w-fit mb-4 transition-transform group-hover:scale-110 ${colors[color]}`}>
                {icon}
            </div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
                {trend && <span className="text-[10px] font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded-full">{trend}</span>}
            </div>
        </div>
    );
}
