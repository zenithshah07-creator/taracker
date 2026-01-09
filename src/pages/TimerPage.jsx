import React, { useState, useCallback, useEffect } from 'react';
import Timer from '../components/Timer';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
    Terminal,
    CheckCircle2,
    Coffee,
    Flame,
    Music,
    CloudRain,
    Wind,
    Volume2,
    Search,
    ChevronDown,
    Zap,
    Activity,
    Clock,
    Save,
    RotateCcw
} from 'lucide-react';

export default function TimerPage() {
    // Persistence Initialization
    const [initialState] = useState(() => {
        const saved = localStorage.getItem('focus_timer_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            let extraTime = 0;
            if (parsed.isRunning && parsed.lastTimestamp) {
                extraTime = Date.now() - parsed.lastTimestamp;
            }
            return {
                time: parsed.currentTime + extraTime,
                isRunning: parsed.isRunning,
                events: parsed.events || []
            };
        }
        return { time: 0, isRunning: false, events: [] };
    });

    const [events, setEvents] = useState(initialState.events);
    const [currentTime, setCurrentTime] = useState(initialState.time);
    const [isRunning, setIsRunning] = useState(initialState.isRunning);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // New Focus Lab Features
    const [mode, setMode] = useState('stopwatch'); // 'stopwatch' or 'pomodoro'
    const [pomodoroDuration, setPomodoroDuration] = useState(25 * 60 * 1000);
    const [todos, setTodos] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [activeAudio, setActiveAudio] = useState(null);
    const [audioRef] = useState(new Audio());

    const AMBIENT_SOUNDS = [
        { id: 'lofi', name: 'Lofi Beats', icon: <Music size={18} />, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder
        { id: 'rain', name: 'Rainfall', icon: <CloudRain size={18} />, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
        { id: 'nature', name: 'Mountain', icon: <Wind size={18} />, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
    ];

    const fetchTodos = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/todos`);
            setTodos(res.data.filter(t => !t.is_completed));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTodos();
    }, []);

    // Ambient Audio Logic
    useEffect(() => {
        const AMBIENT_SOUND_LINKS = {
            lofi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
            nature: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
        };

        if (activeAudio) {
            audioRef.src = AMBIENT_SOUND_LINKS[activeAudio];
            audioRef.loop = true;
            audioRef.play().catch(e => console.log("Audio play blocked", e));
        } else {
            audioRef.pause();
        }
        return () => audioRef.pause();
    }, [activeAudio, audioRef]);

    // Persistence Effect
    useEffect(() => {
        const state = {
            currentTime,
            isRunning,
            events,
            lastTimestamp: Date.now()
        };
        localStorage.setItem('focus_timer_state', JSON.stringify(state));
    }, [currentTime, isRunning, events]);

    const addEvent = useCallback((type) => {
        const newEvent = {
            id: Date.now(),
            type,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            timestamp: Date.now()
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 10));
    }, []);

    const handleSaveSession = async () => {
        if (currentTime < 60000) { // Less than 1 minute
            alert("Session too short to save (minimum 1 minute).");
            return;
        }

        const defaultTopic = selectedTask ? `Focus: ${selectedTask.task}` : "Focused Study Session";
        const topic = prompt("What were you studying?", defaultTopic);
        if (!topic) return;

        setIsSaving(true);
        try {
            const ms = mode === 'stopwatch' ? currentTime : (pomodoroDuration - currentTime);
            const hours = Math.round((ms / 3600000) * 100) / 100;
            const date = new Date().toISOString().split('T')[0];

            await axios.post(`${API_BASE_URL}/api/logs`, {
                date,
                topic,
                hours,
                status: 'completed',
                notes: selectedTask ? `Target Goal: ${selectedTask.task}. Deep work focus session.` : `Deep work focus session.`,
                events: events
            });

            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);

            // If linked to a task, maybe refresh todos but don't mark as complete automatically
            // just logging the effort.
        } catch (err) {
            console.error('Save session error:', err);
            alert("Failed to save session.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">Pro Focus Lab</span>
                        {isRunning && (
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full animate-pulse">
                                <Zap size={10} fill="currentColor" /> Active Session
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Flame className="text-orange-500" /> Focus Laboratory
                    </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                    {/* Mode Switcher */}
                    <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
                        <button
                            onClick={() => { setMode('stopwatch'); setCurrentTime(0); }}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'stopwatch' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            Stopwatch
                        </button>
                        <button
                            onClick={() => { setMode('pomodoro'); setCurrentTime(pomodoroDuration); }}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'pomodoro' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            Pomodoro
                        </button>
                    </div>

                    {currentTime > 0 && !isRunning && (
                        <button
                            onClick={handleSaveSession}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl ${showSaveSuccess ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 hover:bg-indigo-600 text-white shadow-slate-200'}`}
                        >
                            {showSaveSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
                            {showSaveSuccess ? 'Saved' : (isSaving ? 'Saving...' : 'Finish Session')}
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Task & Ambient */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Task Selector */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Zap size={20} /></div>
                            <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs">Target Focus</h3>
                        </div>

                        <div className="relative group">
                            <select
                                onChange={(e) => setSelectedTask(todos.find(t => t.id === parseInt(e.target.value)))}
                                className="w-full pl-4 pr-10 py-4 bg-slate-50 border border-slate-100 rounded-2xl appearance-none font-bold text-slate-700 focus:ring-4 focus:ring-indigo-50 transition-all"
                            >
                                <option value="">General Study</option>
                                {todos.map(task => (
                                    <option key={task.id} value={task.id}>{task.task}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                        </div>
                        {selectedTask && (
                            <div className="mt-4 p-4 bg-indigo-50 rounded-2xl animate-in zoom-in-95">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Current Goal</p>
                                <p className="text-sm font-bold text-indigo-700 leading-tight">{selectedTask.task}</p>
                            </div>
                        )}
                    </div>

                    {/* Ambient Audio */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Volume2 size={20} /></div>
                            <h3 className="font-black text-slate-800 tracking-tight uppercase text-xs">Ambient Aura</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {AMBIENT_SOUNDS.map(sound => (
                                <button
                                    key={sound.id}
                                    onClick={() => setActiveAudio(activeAudio === sound.id ? null : sound.id)}
                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${activeAudio === sound.id ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-slate-50 border-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${activeAudio === sound.id ? 'bg-white/10' : 'bg-white shadow-sm text-rose-500'}`}>
                                            {sound.icon}
                                        </div>
                                        <span className="text-sm font-bold">{sound.name}</span>
                                    </div>
                                    {activeAudio === sound.id && <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center Column: Big Timer */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 pointer-events-none">
                            <Clock size={300} />
                        </div>

                        <Timer
                            minimal={true}
                            mode={mode}
                            duration={pomodoroDuration}
                            initialTime={initialState.time}
                            initialIsRunning={initialState.isRunning}
                            onStart={() => {
                                setIsRunning(true);
                                addEvent('Started');
                            }}
                            onPause={() => {
                                setIsRunning(false);
                                addEvent('Paused');
                            }}
                            onReset={(resetVal) => {
                                setEvents([]);
                                setCurrentTime(resetVal);
                                setIsRunning(false);
                                localStorage.removeItem('focus_timer_state');
                            }}
                            onTick={(t) => setCurrentTime(t)}
                            onComplete={() => {
                                addEvent('Cycle Complete');
                                alert("Session complete! Time for a rest.");
                            }}
                        />

                        {mode === 'pomodoro' && (
                            <div className="mt-8 flex gap-2">
                                {[25, 45, 60].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => { setPomodoroDuration(mins * 60 * 1000); if (!isRunning) setCurrentTime(mins * 60 * 1000); }}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${pomodoroDuration === mins * 60000 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Log Feed & Tips */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-900 rounded-[3rem] p-8 text-indigo-300 shadow-2xl border border-slate-800">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 flex items-center gap-2">
                                    <Terminal size={14} /> Session Logs
                                </h3>
                                <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400"><Coffee size={14} /></div>
                            </div>

                            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 scrollbar-hide">
                                {events.length > 0 ? events.map(event => (
                                    <div key={event.id} className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-300 group">
                                        <span className="text-[10px] font-mono opacity-30">[{event.time}]</span>
                                        <div className="flex-1 flex items-center justify-between">
                                            <p className={`text-xs font-bold ${event.type === 'Started' ? 'text-emerald-400' : event.type === 'Paused' ? 'text-amber-400' : 'text-indigo-300'}`}>
                                                {event.type}
                                            </p>
                                            <div className="h-0.5 w-0 group-hover:w-12 bg-indigo-500/30 transition-all rounded-full"></div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="pt-10 flex flex-col items-center justify-center opacity-20">
                                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-indigo-400 mb-4 animate-spin-slow"></div>
                                        <p className="text-[10px] font-mono uppercase tracking-[0.3em]">Awaiting Data</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-indigo-600 rounded-[3rem] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-4">Focus Intelligence</h3>
                                <p className="text-lg font-bold leading-tight mb-4">"The shorter the gap between decision and action, the higher the flow."</p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-xs font-medium text-indigo-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
                                        <span>Deep work threshold: 23 mins</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-medium text-indigo-100">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
                                        <span>Current Intensity: Optimal</span>
                                    </div>
                                </div>
                            </div>
                            <Activity className="absolute -right-6 -bottom-6 text-white/10 w-40 h-40" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
