import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    Zap,
    Target,
    Star,
    CheckCircle2,
    Circle,
    Clock,
    AlertCircle,
    ChevronRight,
    Flag,
    PlayCircle,
    Plus,
    Search,
    ListTodo,
    Edit2
} from 'lucide-react';

export default function Priorities({ onNavigate }) {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    const triggerRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/todos`);
                setTodos(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching priorities:", err);
                setLoading(false);
            }
        };
        fetchTodos();
    }, [refreshKey]);

    const toggleTodo = async (id, currentStatus) => {
        try {
            await axios.patch(`${API_BASE_URL}/api/todos/${id}`, { is_completed: !currentStatus });
            triggerRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const priorityMissions = todos.filter(t =>
        !t.is_completed && (t.priority === 'High' || t.due_date === todayStr)
    );

    const missionPresets = {
        Study: [
            { icon: <Target size={14} />, title: "DSA Mastery", type: "Study", priority: "High" },
            { icon: <Search size={14} />, title: "Logic Training", type: "Quiz", priority: "Medium" },
            { icon: <ListTodo size={14} />, title: "Algorithm Grind", type: "Study", priority: "High" },
            { icon: <Zap size={14} />, title: "System Architecture", type: "Study", priority: "High" }
        ],
        Tactical: [
            { icon: <Zap size={14} />, title: "Strength Protocol", type: "Other", priority: "High" },
            { icon: <Zap size={14} />, title: "Cardio Blitz", type: "Other", priority: "Medium" },
            { icon: <Zap size={14} />, title: "Mindfulness", type: "Other", priority: "Low" },
            { icon: <Zap size={14} />, title: "Mobility Session", type: "Other", priority: "Medium" }
        ],
        Project: [
            { icon: <Zap size={14} />, title: "Bug Neutralization", type: "Project", priority: "High" },
            { icon: <Plus size={14} />, title: "Rapid Prototype", type: "Project", priority: "High" },
            { icon: <Edit2 size={14} />, title: "Refactor Protocol", type: "Project", priority: "Medium" },
            { icon: <CheckCircle2 size={14} />, title: "Review & Intel", type: "Review", priority: "Medium" }
        ]
    };

    const addMissionFromPreset = async (preset) => {
        try {
            await axios.post(`${API_BASE_URL}/api/todos`, {
                task: preset.title,
                details: "Initialized from priority preset.",
                format: preset.type,
                priority: preset.priority,
                due_date: todayStr,
                is_completed: false,
                source: 'manual'
            });
            triggerRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    const completedToday = todos.filter(t =>
        t.is_completed && t.completed_at && t.completed_at.startsWith(todayStr)
    ).length;

    const readinessScore = priorityMissions.length === 0 ? 100 : Math.max(0, 100 - (priorityMissions.length * 15));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Zap className="text-indigo-500 animate-pulse" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Mission Briefing Header */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-10 text-white shadow-2xl">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-500/30">Immediate Action Required</span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                            <Star size={10} fill="currentColor" className="text-amber-400" /> Daily Briefing
                        </span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Priority Control</h1>
                    <p className="text-slate-400 font-medium">Zero in on today's most critical objectives. High stakes, high focus.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                        <PriorityStat label="Critical Missions" value={priorityMissions.length} icon={<Zap className="text-rose-500" size={20} />} />
                        <PriorityStat label="Successes Today" value={completedToday} icon={<CheckCircle2 className="text-emerald-500" size={20} />} />
                        <PriorityStat label="Readiness Score" value={`${readinessScore}%`} icon={<Target className="text-indigo-400" size={20} />} highlight />
                    </div>
                </div>

                {/* Background Decoration */}
                <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
                    <Zap size={400} />
                </div>
            </div>

            {/* Mission Deployment Zone - Always Persistent */}
            <div className="bg-white rounded-[3rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50 space-y-6">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Mission Deployment Zone</h2>
                    <span className="text-[10px] font-bold text-slate-300">ONE-CLICK INITIALIZATION</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {Object.entries(missionPresets).map(([category, items]) => (
                        <div key={category} className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{category} Sector</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {items.map((preset) => (
                                    <button
                                        key={preset.title}
                                        onClick={() => addMissionFromPreset(preset)}
                                        className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-2xl transition-all group text-left"
                                    >
                                        <div className="p-2 bg-white text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-all shadow-sm">
                                            {preset.icon}
                                        </div>
                                        <span className="text-[11px] font-black text-slate-600 group-hover:text-indigo-600 uppercase tracking-tight">{preset.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mission List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Flag className="text-rose-500" size={24} />
                        Active Priorities
                    </h2>
                    <button
                        onClick={() => onNavigate('todo')}
                        className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                    >
                        View Full Hub
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {priorityMissions.length === 0 ? (
                        <div className="p-16 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                            <Star className="mx-auto text-amber-300 mb-6 drop-shadow-lg" size={48} />
                            <h3 className="text-xl font-black text-slate-700">Clear Skies</h3>
                            <p className="text-slate-400 font-bold mt-2">No active priority missions. Use the Deployment Zone above to launch an objective.</p>
                        </div>
                    ) : (
                        priorityMissions.map(todo => (
                            <PriorityCard
                                key={todo.id}
                                todo={todo}
                                onToggle={() => toggleTodo(todo.id, todo.is_completed)}
                                onLaunch={() => onNavigate('timer')}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function PriorityStat({ label, value, icon, highlight }) {
    return (
        <div className={`p-6 rounded-3xl transition-all ${highlight ? 'bg-indigo-600 shadow-xl shadow-indigo-900/20' : 'bg-white/5 border border-white/10'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${highlight ? 'bg-white/20' : 'bg-slate-800'}`}>
                    {icon}
                </div>
                {highlight && <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">System Ready</span>}
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-indigo-100' : 'text-slate-500'}`}>{label}</p>
            <p className="text-3xl font-black">{value}</p>
        </div>
    );
}

function PriorityCard({ todo, onToggle, onLaunch }) {
    const isOverdue = todo.due_date && new Date(todo.due_date) < new Date().setHours(0, 0, 0, 0);

    return (
        <div className={`group relative bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border-2 transition-all hover:scale-[1.02] flex items-center gap-6 ${isOverdue ? 'border-rose-100' : 'border-slate-50'}`}>
            <button
                onClick={onToggle}
                className={`p-4 rounded-2xl transition-all shadow-sm ${isOverdue ? 'bg-rose-50 text-rose-500 shadow-rose-100' : 'bg-indigo-50 text-indigo-500 shadow-indigo-100'}`}
            >
                <Circle size={24} />
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-black text-slate-800 truncate">{todo.task}</h3>
                    {todo.priority === 'High' && (
                        <span className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase tracking-tighter rounded-full">Critical</span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest">{todo.format}</span>
                    {todo.due_date && (
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                            <Clock size={12} />
                            {isOverdue ? 'MISSION OVERDUE' : `DUE TODAY`}
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={onLaunch}
                className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all group-hover:shadow-xl group-hover:shadow-slate-200"
            >
                <PlayCircle size={16} />
                <span>Launch Focus</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
