import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    Target,
    Plus,
    CheckCircle,
    Circle,
    Trash2,
    Edit2,
    Search,
    Filter,
    Calendar,
    Flag,
    AlertCircle,
    Clock,
    CheckCircle2,
    ListTodo,
    ChevronDown,
    ChevronUp,
    Zap,
    Layout
} from 'lucide-react';

export default function Todo() {
    const [todos, setTodos] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [newDetails, setNewDetails] = useState('');
    const [newFormat, setNewFormat] = useState('Study');
    const [newPriority, setNewPriority] = useState('Medium');
    const [newDueDate, setNewDueDate] = useState('');

    // UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [timeframeFilter, setTimeframeFilter] = useState('all'); // all, today, tomorrow
    const [sortBy, setSortBy] = useState('newest'); // newest, urgency, priority
    const [showCompleted, setShowCompleted] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [showPresets, setShowPresets] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);
    const triggerRefresh = useCallback(() => setRefreshKey(k => k + 1), []);

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/todos');
                if (isMounted) setTodos(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        load();
        return () => { isMounted = false; };
    }, [refreshKey]);

    const addTodo = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            await axios.post('http://localhost:3000/api/todos', {
                task: newTask,
                details: newDetails,
                format: newFormat,
                priority: newPriority,
                due_date: newDueDate,
                is_completed: false,
                source: 'manual'
            });
            setNewTask('');
            setNewDetails('');
            setNewFormat('Study');
            setNewPriority('Medium');
            setNewDueDate('');
            setIsAdding(false);
            triggerRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleTodo = async (id, currentStatus) => {
        try {
            await axios.patch(`http://localhost:3000/api/todos/${id}`, { is_completed: !currentStatus });
            triggerRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteTodo = async (e, id) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await axios.delete(`http://localhost:3000/api/todos/${id}`);
            triggerRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    const editTodo = async (e, todo) => {
        e.stopPropagation();
        const updatedTask = prompt('Edit task:', todo.task);
        if (updatedTask === null || updatedTask === todo.task) return;

        try {
            await axios.patch(`http://localhost:3000/api/todos/${todo.id}`, { task: updatedTask });
            triggerRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    const missionPresets = {
        Learning: [
            { icon: <Target size={14} />, title: "DSA Mastery", type: "Study", priority: "High" },
            { icon: <Zap size={14} />, title: "Tech Stack Research", type: "Review", priority: "Medium" },
            { icon: <ListTodo size={14} />, title: "System Design Prep", type: "Study", priority: "High" },
            { icon: <Search size={14} />, title: "Logic Training", type: "Quiz", priority: "Medium" }
        ],
        Tactical: [
            { icon: <Zap size={14} />, title: "Cardio Blitz", type: "Other", priority: "Medium" },
            { icon: <Zap size={14} />, title: "Strength Protocol", type: "Other", priority: "High" },
            { icon: <Zap size={14} />, title: "Mindfulness Session", type: "Other", priority: "Low" }
        ],
        Project: [
            { icon: <Plus size={14} />, title: "Rapid Prototyping", type: "Project", priority: "High" },
            { icon: <AlertCircle size={14} />, title: "Bug Neutralization", type: "Project", priority: "High" },
            { icon: <Edit2 size={14} />, title: "Code Refactoring", type: "Project", priority: "Medium" },
            { icon: <CheckCircle2 size={14} />, title: "Quality Review", type: "Review", priority: "Medium" }
        ]
    };

    const applyPreset = (preset) => {
        setNewTask(preset.title);
        setNewFormat(preset.type);
        setNewPriority(preset.priority);
        setShowPresets(false);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    const getUrgencyInfo = (dueDate) => {
        if (!dueDate) return { label: 'No Deadline', color: 'text-slate-400', isOverdue: false };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);

        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { label: `${Math.abs(diffDays)}d Overdue`, color: 'text-rose-600 bg-rose-50 border-rose-200 animate-pulse font-black', isOverdue: true };
        } else if (diffDays === 0) {
            return { label: 'Due Today', color: 'text-amber-600 bg-amber-50 border-amber-200 font-black', isOverdue: false };
        } else if (diffDays === 1) {
            return { label: 'Tomorrow', color: 'text-indigo-600 bg-indigo-50 border-indigo-100 font-bold', isOverdue: false };
        } else if (diffDays <= 3) {
            return { label: `In ${diffDays} days`, color: 'text-indigo-500 bg-indigo-50 border-indigo-50', isOverdue: false };
        } else {
            return { label: `Due ${due.toLocaleDateString()}`, color: 'text-slate-500 bg-slate-50 border-slate-100', isOverdue: false };
        }
    };

    const filteredTodos = todos.filter(todo => {
        const matchesSearch = todo.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (todo.details && todo.details.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = filterType === 'all' || todo.format === filterType;
        const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;

        let matchesTimeframe = true;
        if (timeframeFilter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            matchesTimeframe = todo.due_date === today;
        } else if (timeframeFilter === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            matchesTimeframe = todo.due_date === tomorrowStr;
        }

        return matchesSearch && matchesType && matchesPriority && matchesTimeframe;
    }).sort((a, b) => {
        if (sortBy === 'newest') return b.id - a.id;
        if (sortBy === 'priority') {
            const weights = { High: 3, Medium: 2, Low: 1 };
            return weights[b.priority] - weights[a.priority];
        }
        if (sortBy === 'urgency') {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date) - new Date(b.due_date);
        }
        return 0;
    });

    const activeTasks = filteredTodos.filter(t => !t.is_completed);
    const completedTasks = filteredTodos.filter(t => t.is_completed);

    const stats = {
        total: todos.length,
        pending: todos.filter(t => !t.is_completed).length,
        completed: todos.filter(t => t.is_completed).length,
        highPriority: todos.filter(t => !t.is_completed && t.priority === 'High').length,
        overdue: todos.filter(t => {
            if (t.is_completed || !t.due_date) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return new Date(t.due_date) < today;
        }).length
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24">
            {/* Header with Glassmorphism */}
            <div className="relative overflow-hidden rounded-[3rem] bg-indigo-600 p-10 text-white shadow-2xl shadow-indigo-200">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-indigo-500/30 text-indigo-100 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-400/30">Task Hub</span>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                <Zap size={10} fill="currentColor" /> Mastery 1.0
                            </span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Mission Control</h1>
                        <p className="text-indigo-100 font-medium">Coordinate your studies, conquer your goals.</p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <StatItem label="Total Missions" value={stats.total} />
                        <StatItem label="Active" value={stats.pending} />
                        <StatItem label="Overdue" value={stats.overdue} highlight />
                        <StatItem label="Success" value={stats.completed} />
                        <StatItem label="Critical" value={stats.highPriority} />
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 p-20 opacity-10 rotate-12 pointer-events-none">
                    <CheckCircle2 size={300} />
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row items-center gap-4">
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`w-full lg:w-auto flex items-center justify-center gap-2 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl border-none outline-none z-10 ${isAdding ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-indigo-600 text-white shadow-indigo-200 hover:scale-105 active:scale-95'}`}
                >
                    {isAdding ? <Plus className="rotate-45" size={18} /> : <Plus size={18} />}
                    {isAdding ? 'Cancel Mission' : 'New Mission'}
                </button>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search your missions..."
                        className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-indigo-50 shadow-xl shadow-slate-200/50 font-bold text-slate-600 placeholder:text-slate-300 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <div className="relative group lg:flex-none flex-1">
                        <Layout className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full pl-10 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 appearance-none font-bold text-slate-600 text-sm outline-none cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            <option value="Study">Study</option>
                            <option value="Assignment">Assignment</option>
                            <option value="Project">Project</option>
                            <option value="Quiz">Quiz</option>
                            <option value="Review">Review</option>
                            <option value="Other">Other</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    </div>

                    <div className="relative group lg:flex-none flex-1">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={timeframeFilter}
                            onChange={(e) => setTimeframeFilter(e.target.value)}
                            className="w-full pl-10 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 appearance-none font-bold text-slate-600 text-sm outline-none cursor-pointer"
                        >
                            <option value="all">All Dates</option>
                            <option value="today">Today's Focus</option>
                            <option value="tomorrow">Tomorrow's Agenda</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    </div>

                    <div className="relative group lg:flex-none flex-1">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={filterPriority}
                            onChange={(e) => setFilterPriority(e.target.value)}
                            className="w-full pl-10 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 appearance-none font-bold text-slate-600 text-sm outline-none cursor-pointer"
                        >
                            <option value="all">Priority</option>
                            <option value="High">High ⚠️</option>
                            <option value="Medium">Medium ⚡</option>
                            <option value="Low">Low ✅</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    </div>

                    <div className="relative group lg:flex-none flex-1">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full pl-10 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50 appearance-none font-bold text-slate-600 text-sm outline-none cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="urgency">Urgency (Timeline)</option>
                            <option value="priority">Rank (High to Low)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {/* Add Task Form - Premium Dropdown */}
            {isAdding && (
                <form onSubmit={addTodo} className="bg-white p-10 rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 space-y-8 animate-in slide-in-from-top-10 duration-500">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                                <Plus size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800">Initialize New Mission</h2>
                                <p className="text-xs font-bold text-slate-400">Set your tactical parameters</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowPresets(!showPresets)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showPresets ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            <Zap size={14} fill={showPresets ? "white" : "none"} />
                            Mission Presets
                        </button>
                    </div>

                    {showPresets && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 animate-in zoom-in-95 duration-300">
                            {Object.entries(missionPresets).map(([category, items]) => (
                                <div key={category} className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">{category} Intelligence</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {items.map((preset) => (
                                            <button
                                                key={preset.title}
                                                type="button"
                                                onClick={() => applyPreset(preset)}
                                                className="flex items-center gap-3 p-4 bg-white hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-2xl transition-all group text-left"
                                            >
                                                <div className="p-2 bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-indigo-600 rounded-xl transition-colors">
                                                    {preset.icon}
                                                </div>
                                                <span className="text-sm font-black text-slate-600 group-hover:text-indigo-600">{preset.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Mission Title</label>
                                <input
                                    type="text"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    placeholder="Enter your target task..."
                                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-300 rounded-2xl font-bold text-slate-700 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Briefings & Intel</label>
                                <textarea
                                    value={newDetails}
                                    onChange={(e) => setNewDetails(e.target.value)}
                                    placeholder="Add any additional details..."
                                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-300 rounded-2xl font-bold text-slate-700 outline-none transition-all h-32 resize-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Mission Type</label>
                                    <div className="relative">
                                        <select
                                            value={newFormat}
                                            onChange={(e) => setNewFormat(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-300 rounded-2xl font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="Study">Study</option>
                                            <option value="Assignment">Assignment</option>
                                            <option value="Project">Project</option>
                                            <option value="Quiz">Quiz</option>
                                            <option value="Review">Review</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Priority</label>
                                    <div className="relative">
                                        <select
                                            value={newPriority}
                                            onChange={(e) => setNewPriority(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-300 rounded-2xl font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="High">High ⚠️</option>
                                            <option value="Medium">Medium ⚡</option>
                                            <option value="Low">Low ✅</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Deadline</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            value={newDueDate}
                                            onChange={(e) => setNewDueDate(e.target.value)}
                                            className="w-full pl-16 pr-6 py-4 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-300 rounded-2xl font-bold text-slate-700 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const tom = new Date();
                                            tom.setDate(tom.getDate() + 1);
                                            setNewDueDate(tom.toISOString().split('T')[0]);
                                        }}
                                        className="px-4 py-4 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm whitespace-nowrap"
                                    >
                                        Tomorrow
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-auto bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                            >
                                <Zap size={18} fill="currentColor" />
                                <span>Initialize Mission</span>
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Missions List */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <ListTodo className="text-indigo-600" size={24} />
                        Active Missions
                        <span className="text-xs font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest">{activeTasks.length}</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {activeTasks.length === 0 ? (
                        <div className="p-20 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                            <Target className="mx-auto text-slate-300 mb-6" size={64} />
                            <h3 className="text-2xl font-black text-slate-700">No active missions</h3>
                            <p className="text-slate-400 font-bold mt-2 max-w-sm mx-auto">Create a new mission or upload a roadmap to start your conquer!</p>
                        </div>
                    ) : (
                        activeTasks.map(todo => (
                            <TodoCard
                                key={todo.id}
                                todo={todo}
                                toggleTodo={toggleTodo}
                                deleteTodo={deleteTodo}
                                editTodo={editTodo}
                                getPriorityColor={getPriorityColor}
                                getUrgencyInfo={getUrgencyInfo}
                            />
                        ))
                    )}
                </div>

                {/* Completed Section Dropdown */}
                {completedTasks.length > 0 && (
                    <div className="pt-10">
                        <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="flex items-center gap-4 text-slate-400 hover:text-indigo-600 transition-colors group mb-6"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Declassified Missions ({completedTasks.length})</span>
                            <div className="flex-1 h-px bg-slate-100"></div>
                            <div className={`p-2 rounded-xl bg-slate-50 transition-all ${showCompleted ? 'rotate-180 bg-indigo-50 text-indigo-500' : ''}`}>
                                <ChevronDown size={18} />
                            </div>
                        </button>

                        {showCompleted && (
                            <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-top-4 duration-500">
                                {completedTasks.map(todo => (
                                    <TodoCard
                                        key={todo.id}
                                        todo={todo}
                                        toggleTodo={toggleTodo}
                                        deleteTodo={deleteTodo}
                                        editTodo={editTodo}
                                        getPriorityColor={getPriorityColor}
                                        getUrgencyInfo={getUrgencyInfo}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatItem({ label, value, highlight }) {
    return (
        <div className={`p-5 rounded-2xl min-w-[120px] transition-all hover:scale-105 ${highlight ? 'bg-white/20 border border-white/20' : 'bg-white/10'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">{label}</p>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
}

function TodoCard({ todo, toggleTodo, deleteTodo, editTodo, getPriorityColor, getUrgencyInfo }) {
    const urgency = getUrgencyInfo(todo.due_date);

    return (
        <div
            onClick={() => toggleTodo(todo.id, todo.is_completed)}
            className={`bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all hover:shadow-2xl hover:shadow-indigo-100/50 group cursor-pointer relative overflow-hidden ${todo.is_completed ? 'opacity-60 grayscale-[0.5]' :
                urgency.isOverdue ? 'border-rose-100 shadow-lg shadow-rose-50' : ''
                }`}
        >
            {/* Overdue Pulse Background */}
            {!todo.is_completed && urgency.isOverdue && (
                <div className="absolute inset-0 bg-rose-50/40 animate-pulse pointer-events-none"></div>
            )}

            <div className="flex items-start gap-6 relative z-10">
                <div className={`mt-1 p-3 rounded-2xl transition-all shadow-sm ${todo.is_completed ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300 border border-slate-100 group-hover:border-indigo-300 group-hover:bg-indigo-50 group-hover:text-indigo-400'}`}>
                    {todo.is_completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                </div>

                <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`text-xl font-black tracking-tight leading-snug ${todo.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {todo.task}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                            {todo.priority && (
                                <span className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getPriorityColor(todo.priority)}`}>
                                    <Flag size={10} fill="currentColor" /> {todo.priority}
                                </span>
                            )}
                            <span className="px-3 py-1 text-[10px] font-black bg-indigo-50 text-indigo-500 uppercase tracking-widest rounded-full">{todo.format}</span>
                            {todo.source === 'pdf' && (
                                <span className="flex items-center gap-1 px-3 py-1 text-[10px] font-black bg-purple-50 text-purple-500 uppercase tracking-widest rounded-full">
                                    <Zap size={10} fill="currentColor" /> Roadmap
                                </span>
                            )}
                        </div>
                    </div>

                    {todo.details && (
                        <p className={`text-sm font-medium ${todo.is_completed ? 'text-slate-300' : 'text-slate-500'}`}>
                            {todo.details}
                        </p>
                    )}

                    <div className="flex items-center gap-6 pt-2">
                        {todo.due_date && (
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${urgency.color}`}>
                                    <Clock size={12} />
                                    <span>{urgency.label}</span>
                                </div>
                                {!todo.is_completed && !urgency.isOverdue && (
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Target: {new Date(todo.due_date).toLocaleDateString()}</span>
                                )}
                            </div>
                        )}
                        {todo.completed_at && todo.is_completed && (
                            <div className="flex items-center gap-2 text-emerald-500">
                                <CheckCircle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Finished: {new Date(todo.completed_at).toLocaleDateString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 ml-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); editTodo(e, todo); }}
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                        title="Edit Mission"
                    >
                        <Edit2 size={20} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); deleteTodo(e, todo.id); }}
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        title="Abort Mission"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {!todo.is_completed && todo.priority === 'High' && (
                <div className="absolute top-0 right-0 w-2 h-full bg-rose-500 opacity-20"></div>
            )}
        </div>
    );
}
