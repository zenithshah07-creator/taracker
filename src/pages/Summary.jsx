import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    BarChart as ReChartsBarChart,
    Bar, XAxis, YAxis,
    CartesianGrid, Tooltip,
    ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Activity,
    TrendingUp,
    CheckCircle2,
    Clock,
    LayoutDashboard,
    BarChart3,
    Flame,
    Trophy,
    PieChart as PieChartIcon,
    AlertCircle,
    Lightbulb,
    CheckCircle,
    XCircle,
    ChevronRight,
    Zap,
    Rocket,
    Target as TargetIcon,
    Star,
    X
} from 'lucide-react';

export default function Summary() {
    const [data, setData] = useState([
        { name: 'Mon', hours: 0 },
        { name: 'Tue', hours: 0 },
        { name: 'Wed', hours: 0 },
        { name: 'Thu', hours: 0 },
        { name: 'Fri', hours: 0 },
        { name: 'Sat', hours: 0 },
        { name: 'Sun', hours: 0 },
    ]);

    const [stats, setStats] = useState({ total_hours: 0, total_completions: 0, pending: 0 });
    const [todayReport, setTodayReport] = useState({
        addedToday: 0,
        completedToday: 0,
        pendingTotal: 0,
        addedTasks: [],
        completedTasks: []
    });
    const [formatData, setFormatData] = useState([]);
    const [streak, setStreak] = useState(0);
    const [insights, setInsights] = useState({ bestDay: { name: 'None', hours: 0 }, goalProgress: 0 });
    const [weeklyActivities, setWeeklyActivities] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [showDayDetail, setShowDayDetail] = useState(false);
    const [selectedDayData, setSelectedDayData] = useState(null);

    const formatDateTime = (isoString) => {
        if (!isoString) return null;
        try {
            const date = new Date(isoString);
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            return `${dateStr}, ${time}`;
        } catch {
            return null;
        }
    };

    useEffect(() => {
        const processStats = (logs, todos, report) => {
            // 1. Chart Data (Study Hours)
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const newData = days.map(day => ({ name: day, hours: 0 }));
            let maxHours = 0;
            let bestDayName = 'None';

            logs.forEach(log => {
                if (!log.date || isNaN(log.hours)) return;
                const date = new Date(log.date);
                const dayIndex = date.getDay();
                if (!isNaN(dayIndex) && newData[dayIndex]) {
                    newData[dayIndex].hours += Number(log.hours) || 0;
                    if (newData[dayIndex].hours > maxHours) {
                        maxHours = newData[dayIndex].hours;
                        bestDayName = days[dayIndex];
                    }
                }
            });
            setData(newData);

            // 2. Format Breakdown (Pie Chart)
            const formats = {};
            todos.forEach(t => {
                if (t.format) {
                    formats[t.format] = (formats[t.format] || 0) + 1;
                }
            });
            const pieData = Object.keys(formats).map(f => ({ name: f, value: formats[f] }));
            setFormatData(pieData);

            // 3. Streak Calculation
            const activeDates = new Set([
                ...logs.map(l => l.date),
                ...todos.filter(t => t.completed_at).map(t => t.completed_at.split('T')[0])
            ]);

            let currentStreak = 0;
            const checkDate = new Date();
            while (true) {
                const dateStr = checkDate.toISOString().split('T')[0];
                if (activeDates.has(dateStr)) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
            setStreak(currentStreak);

            // 4. Summaries
            const totalTasks = todos.length || 1;

            setInsights({
                bestDay: { name: bestDayName, hours: maxHours },
                goalProgress: Math.round((todos.filter(t => t.is_completed).length / totalTasks) * 100)
            });

            // 5. Weekly Analysis (Last 7 Days)
            const analysis = [];
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dStr = d.toISOString().split('T')[0];

                const dayLogs = logs.filter(l => l.date === dStr);
                const dayTodos = todos.filter(t => t.completed_at && t.completed_at.startsWith(dStr));

                const missed = (i > 0) ? todos.filter(t => !t.is_completed && t.created_at && t.created_at.startsWith(dStr)) : [];

                analysis.push({
                    date: dStr,
                    dayName: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayNames[d.getDay()],
                    hours: dayLogs.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0),
                    tasks: dayLogs.length + dayTodos.length,
                    missed: missed.length,
                    details: {
                        done: [
                            ...dayLogs.map(l => ({
                                title: l.topic,
                                type: 'Study Log',
                                value: `${l.hours}h`,
                                addedAt: formatDateTime(l.created_at),
                                doneAt: formatDateTime(l.created_at) // For logs, creation is completion
                            })),
                            ...dayTodos.map(t => ({
                                title: t.title,
                                type: 'Task',
                                value: 'Completed',
                                addedAt: formatDateTime(t.created_at),
                                doneAt: formatDateTime(t.completed_at)
                            }))
                        ],
                        missed: missed.map(t => ({
                            title: t.title,
                            type: 'Task',
                            value: 'Pending',
                            addedAt: formatDateTime(t.created_at)
                        }))
                    }
                });
            }
            setWeeklyActivities(analysis);

            // 6. Smart Suggestions
            const newSuggestions = [];
            const avgHours = logs.length > 0 ? (logs.reduce((acc, l) => acc + (Number(l.hours) || 0), 0) / logs.length) : 0;

            if (currentStreak < 3) newSuggestions.push({ type: 'improve', text: "Consistency is key. Try to study for at least 15 minutes tomorrow to build your streak!" });
            if (avgHours < 2) newSuggestions.push({ type: 'tip', text: "Deep work sessions of 90+ minutes often lead to better retention. Try blocking out one long session." });
            if (report.pendingTotal > 10) newSuggestions.push({ type: 'warn', text: "Your pending list is growing. Consider a 'Clear Out' day to focus only on finishing old tasks." });
            if (bestDayName !== 'None') newSuggestions.push({ type: 'success', text: `You're dominant on ${bestDayName}s! Keep using that momentum for your hardest topics.` });

            setSuggestions(newSuggestions);
        };

        const fetchData = async () => {
            try {
                const [statsRes, logsRes, reportRes, todosRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/summary'),
                    axios.get('http://localhost:3000/api/logs'),
                    axios.get('http://localhost:3000/api/todos/report/today'),
                    axios.get('http://localhost:3000/api/todos')
                ]);

                processStats(logsRes.data, todosRes.data, reportRes.data);

                setStats({
                    total_hours: statsRes.data.total_hours || 0,
                    total_completions: statsRes.data.completed_topics || 0,
                    pending: statsRes.data.pending_topics || 0
                });

                const today = new Date().toISOString().split('T')[0];
                const addedTasksToday = todosRes.data.filter(t => t.created_at && t.created_at.startsWith(today));
                const completedTasksToday = todosRes.data.filter(t => t.completed_at && t.completed_at.startsWith(today));

                setTodayReport({
                    ...reportRes.data,
                    addedTasks: addedTasksToday,
                    completedTasks: completedTasksToday
                });
            } catch (err) {
                console.error(err);
            }
        };

        fetchData();
    }, []);

    const handleGeneratePlan = () => {
        // Analysis logic
        const weakestDay = [...weeklyActivities].sort((a, b) => a.hours - b.hours)[0];
        const mostCompletedFormat = formatData.length > 0 ? [...formatData].sort((a, b) => b.value - a.value)[0] : null;

        const newPlan = {
            title: "Your Growth Strategy",
            weekRange: "Next 7 Days",
            goals: [
                {
                    id: 1,
                    type: 'consistency',
                    title: `${streak > 0 ? 'Extend' : 'Start'} Your Streak`,
                    desc: `Aim for a ${streak + 3}-day streak. Log at least 30 mins daily.`,
                    icon: <Flame className="text-orange-500" />,
                    reason: streak === 0 ? "You're fresh at the start—momentum is everything." : `You've done ${streak} days, you're becoming unstoppable!`
                },
                {
                    id: 2,
                    type: 'performance',
                    title: `Conquer ${weakestDay?.dayName || 'Sundays'}`,
                    desc: `Set a goal of 2 hours on your quietest day.`,
                    icon: <TargetIcon className="text-indigo-500" />,
                    reason: `Data shows ${weakestDay?.dayName || 'Sundays'} are your lowest focus periods.`
                },
                {
                    id: 3,
                    type: 'balance',
                    title: "Diversify Your Focus",
                    desc: `Add 3 tasks for a new topic outside "${mostCompletedFormat?.name || 'Study'}".`,
                    icon: <Rocket className="text-purple-500" />,
                    reason: `You're dominant in "${mostCompletedFormat?.name || 'Study'}", let's broaden your skills.`
                }
            ]
        };

        setGeneratedPlan(newPlan);
        setShowPlanModal(true);
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-10 pb-24 animate-in fade-in duration-700">
            <header>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Productivity Summary</h1>
                <p className="text-gray-500 mt-2 text-lg">Your progress and daily achievements at a glance.</p>
            </header>

            {/* Deep Insights Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-gradient-to-br from-orange-400 to-rose-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-rose-100 flex items-center justify-between relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="text-xs font-bold opacity-80 uppercase tracking-[0.2em] mb-1">Consistency Streak</div>
                        <div className="text-5xl font-black flex items-baseline gap-2">
                            {streak} <span className="text-xl font-medium opacity-80">Days</span>
                        </div>
                        <p className="mt-3 text-sm opacity-90 font-medium">Keep the fire burning! 🔥</p>
                    </div>
                    <Flame size={80} className="absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform" />
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center justify-between group">
                    <div>
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Peak Productivity</div>
                        <div className="text-3xl font-black text-indigo-600">
                            {insights.bestDay.name}
                        </div>
                        <div className="text-sm text-gray-400 font-bold mt-1">
                            {Math.round(insights.bestDay.hours * 10) / 10} hours logged
                        </div>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:rotate-12 transition-transform">
                        <Trophy size={32} />
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center justify-between">
                    <div className="flex-1">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Goal completion</div>
                        <div className="text-4xl font-black text-gray-900">{insights.goalProgress}%</div>
                        <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                                style={{ width: `${insights.goalProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Report */}
            <section className="space-y-6">
                <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                    Today's Productivity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 group hover:scale-[1.02] transition-all flex flex-col">
                        <div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-500 transition-colors">Added Today</div>
                            <div className="text-5xl font-black text-gray-900">{todayReport.addedToday}</div>
                        </div>
                        <div className="mt-6 flex-1 space-y-3">
                            {todayReport.addedTasks.slice(0, 3).map((task, i) => (
                                <div key={i} className="flex flex-col p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                    <span className="text-xs font-bold text-gray-800 truncate">{task.title}</span>
                                    <span className="text-[9px] font-black text-indigo-400 uppercase mt-1">Added: {formatDateTime(task.created_at)}</span>
                                </div>
                            ))}
                            {todayReport.addedToday > 3 && (
                                <p className="text-[10px] font-bold text-gray-400 text-center italic">+{todayReport.addedToday - 3} more items</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 group hover:scale-[1.02] transition-all flex flex-col">
                        <div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-emerald-500 transition-colors">Completed Today</div>
                            <div className="text-5xl font-black text-emerald-600">{todayReport.completedToday}</div>
                        </div>
                        <div className="mt-6 flex-1 space-y-3">
                            {todayReport.completedTasks.slice(0, 3).map((task, i) => (
                                <div key={i} className="flex flex-col p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                    <span className="text-xs font-bold text-gray-800 truncate">{task.title}</span>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[9px] font-black text-gray-400 uppercase">Added: {formatDateTime(task.created_at)}</span>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase">Done: {formatDateTime(task.completed_at)}</span>
                                    </div>
                                </div>
                            ))}
                            {todayReport.completedToday > 3 && (
                                <p className="text-[10px] font-bold text-gray-400 text-center italic">+{todayReport.completedToday - 3} more items</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 group hover:scale-[1.02] transition-all">
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-amber-500 transition-colors">Still Pending</div>
                        <div className="text-5xl font-black text-amber-500">{todayReport.pendingTotal}</div>
                        <div className="mt-6 p-4 bg-amber-50/50 rounded-[1.5rem] border border-amber-100/50">
                            <p className="text-xs font-medium text-amber-700 leading-relaxed">
                                You have {todayReport.pendingTotal} tasks waiting. Stay focused to turn them into wins!
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                            <Activity size={20} className="text-indigo-500" /> Study Hours Distribution
                        </h3>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 px-3 py-1 rounded-full">Weekly View</span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ReChartsBarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 700 }} />
                                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="hours" fill="#4F46E5" radius={[8, 8, 0, 0]} barSize={40} />
                            </ReChartsBarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                            <PieChartIcon size={20} className="text-purple-500" /> Task Distribution
                        </h3>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 px-3 py-1 rounded-full">By Format</span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={formatData}
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {formatData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Weekly Analysis & Suggestions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Recap Timeline */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                            <TrendingUp size={24} className="text-indigo-500" /> Weekly Recap
                        </h3>
                        <span className="text-sm font-bold text-gray-400">Last 7 Days</span>
                    </div>
                    <div className="space-y-4">
                        {weeklyActivities.map((day, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    setSelectedDayData(day);
                                    setShowDayDetail(true);
                                }}
                                className="flex items-center gap-6 p-4 rounded-3xl hover:bg-indigo-50/50 transition-all border border-transparent hover:border-indigo-100 cursor-pointer group"
                            >
                                <div className="w-24">
                                    <div className="text-xs font-black text-gray-400 uppercase tracking-tighter group-hover:text-indigo-400 transition-colors">{day.dayName}</div>
                                    <div className="text-xs text-gray-400">{day.date.split('-').slice(1).join('/')}</div>
                                </div>
                                <div className="flex-1 flex gap-4">
                                    <div className="flex-1 bg-gray-100 h-10 rounded-2xl overflow-hidden flex items-center px-4 justify-between group-hover:bg-white transition-colors">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={14} className="text-emerald-500" />
                                            <span className="text-xs font-bold text-gray-600">{day.tasks} Finished</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-indigo-500" />
                                            <span className="text-xs font-bold text-gray-600">{Math.round(day.hours * 10) / 10}h Focus</span>
                                        </div>
                                    </div>
                                    {day.missed > 0 && (
                                        <div className="bg-rose-50 px-4 h-10 rounded-2xl flex items-center gap-2 border border-rose-100">
                                            <XCircle size={14} className="text-rose-500" />
                                            <span className="text-xs font-black text-rose-600">{day.missed} Missed</span>
                                        </div>
                                    )}
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-all translate-x-0 group-hover:translate-x-1" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Smart Suggestions Panel */}
                <div className="space-y-8">
                    <div className="bg-indigo-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                <Zap className="text-amber-400" size={20} /> Smart Advice
                            </h3>
                            <div className="space-y-6">
                                {suggestions.map((s, idx) => (
                                    <div key={idx} className="flex gap-4 group">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${s.type === 'improve' ? 'bg-amber-400' :
                                            s.type === 'warn' ? 'bg-rose-400' :
                                                s.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'
                                            }`}></div>
                                        <p className="text-sm font-medium text-indigo-100 leading-relaxed group-hover:text-white transition-colors">
                                            {s.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleGeneratePlan}
                                className="w-full mt-10 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-white/10"
                            >
                                Generate New Plan
                            </button>
                        </div>
                        <Lightbulb className="absolute -right-8 -bottom-8 opacity-5 text-white" size={160} />
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10 text-center">
                            <div className="text-xs font-bold opacity-70 uppercase tracking-widest mb-1">Efficiency Level</div>
                            <div className="text-5xl font-black mb-2">A+</div>
                            <p className="text-xs opacity-80">You're in the top 5% of learners this week!</p>
                        </div>
                    </div>
                </div>
            </div>

            <section className="space-y-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-4">Lifetime Aggregates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-indigo-700 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="text-xs font-bold opacity-70 uppercase tracking-widest mb-2">Total Study Hours</div>
                            <div className="text-5xl font-black">{Math.round(stats.total_hours * 10) / 10}</div>
                        </div>
                        <div className="absolute -right-4 -bottom-4 text-white/10 rotate-12 scale-150 transition-transform group-hover:rotate-0">
                            <BarChart3 size={120} />
                        </div>
                    </div>
                    <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-100">
                        <div className="text-xs font-bold opacity-70 uppercase tracking-widest mb-2">Total Topics Done</div>
                        <div className="text-5xl font-black">{stats.total_completions}</div>
                    </div>
                    <div className="bg-gray-800 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200">
                        <div className="text-xs font-bold opacity-70 uppercase tracking-widest mb-2">Topics Awaiting</div>
                        <div className="text-5xl font-black">{stats.pending}</div>
                    </div>
                </div>
            </section>

            {/* Improvement Plan Modal */}
            {showPlanModal && generatedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-indigo-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className="bg-indigo-600 p-8 text-white relative">
                            <button
                                onClick={() => setShowPlanModal(false)}
                                className="absolute right-6 top-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-white/20 rounded-2xl">
                                    <Rocket size={32} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black leading-tight">{generatedPlan.title}</h2>
                                    <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest">{generatedPlan.weekRange}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            {generatedPlan.goals.map((goal) => (
                                <div key={goal.id} className="group p-6 rounded-3xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                                    <div className="flex gap-5">
                                        <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-white group-hover:shadow-md transition-all shrink-0">
                                            {goal.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-gray-900 mb-1">{goal.title}</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed mb-3">{goal.desc}</p>
                                            <div className="flex items-start gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50/50 w-fit px-3 py-1.5 rounded-lg">
                                                <Star size={10} className="mt-0.5" />
                                                <span>Reason: {goal.reason}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setShowPlanModal(false)}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
                            >
                                <span>Lock In This Plan</span>
                                <Zap size={18} className="group-hover:scale-125 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Detail Modal */}
            {showDayDetail && selectedDayData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">{selectedDayData.dayName}'s Report</h3>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">{selectedDayData.date}</p>
                            </div>
                            <button
                                onClick={() => setShowDayDetail(false)}
                                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Focus Pulse Summary */}
                            <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 flex items-center justify-between relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h4 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Total Focus Time</h4>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black">{Math.round(selectedDayData.hours * 10) / 10}</span>
                                        <span className="text-xl font-bold opacity-80">Hours</span>
                                    </div>
                                    <p className="text-xs font-bold mt-2 text-indigo-100 italic">Logged from Study Timer</p>
                                </div>
                                <div className="p-5 bg-white/20 rounded-3xl relative z-10 backdrop-blur-sm group-hover:scale-110 transition-transform">
                                    <Clock size={40} />
                                </div>
                                <div className="absolute -right-8 -bottom-8 opacity-20 text-white rotate-12">
                                    <Clock size={160} />
                                </div>
                            </div>

                            {/* Accomplishments */}
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                                    <CheckCircle size={14} /> The Wins ({selectedDayData.details.done.length})
                                </h4>
                                {selectedDayData.details.done.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedDayData.details.done.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 group/item">
                                                <div>
                                                    <div className="text-sm font-bold text-gray-800">{item.title}</div>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <div className="text-[10px] font-black text-emerald-600 uppercase">{item.type}</div>
                                                        {item.addedAt && (
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded-md">
                                                                <Clock size={10} /> Task Added: {item.addedAt}
                                                            </div>
                                                        )}
                                                        {item.doneAt && (
                                                            <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-50/50 px-2 py-0.5 rounded-md border border-emerald-100/50">
                                                                <CheckCircle2 size={10} /> Goal Finished: {item.doneAt}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-emerald-600 bg-white px-3 py-1 rounded-lg border border-emerald-100 shadow-sm">
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                                        <p className="text-xs font-bold text-gray-400">No accomplishments logged for this day.</p>
                                    </div>
                                )}
                            </div>

                            {/* Missed Tasks */}
                            {(selectedDayData.dayName !== 'Today' && selectedDayData.details.missed.length > 0) && (
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-xs font-black text-rose-600 uppercase tracking-widest">
                                        <XCircle size={14} /> Missed Deadlines ({selectedDayData.details.missed.length})
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedDayData.details.missed.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                                                <div>
                                                    <div className="text-sm font-bold text-gray-800">{item.title}</div>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <div className="text-[10px] font-black text-rose-600 uppercase">{item.type}</div>
                                                        {item.addedAt && (
                                                            <div className="flex items-center gap-1 text-[10px] text-rose-400 font-bold bg-rose-50/50 px-2 py-0.5 rounded-md border border-rose-100/50">
                                                                <Clock size={10} /> Task Added: {item.addedAt}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-rose-600 bg-white px-3 py-1 rounded-lg border border-rose-100">
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedDayData.dayName === 'Today' && selectedDayData.details.missed.length > 0 && (
                                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100">
                                    <div className="flex items-center gap-3 text-amber-600 mb-2">
                                        <Zap size={20} />
                                        <span className="text-sm font-black uppercase tracking-tight">Focus Up!</span>
                                    </div>
                                    <p className="text-xs font-medium text-amber-700 leading-relaxed">
                                        You still have **{selectedDayData.details.missed.length} tasks** pending for today. There's still time to turn this day into a win!
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-gray-50 flex gap-4">
                            <button
                                onClick={() => setShowDayDetail(false)}
                                className="flex-1 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-gray-200"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
