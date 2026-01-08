import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function Timer({
    minimal = false,
    onStart,
    onPause,
    onReset,
    onTick,
    onComplete,
    initialTime = 0,
    initialIsRunning = false,
    mode = 'stopwatch', // 'stopwatch' or 'pomodoro'
    duration = 25 * 60 * 1000 // default 25 mins for pomodoro
}) {
    const [time, setTime] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(initialIsRunning);

    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                setTime((prev) => {
                    let next;
                    if (mode === 'stopwatch') {
                        next = prev + 10;
                    } else {
                        next = Math.max(0, prev - 10);
                        if (next === 0 && prev > 0) {
                            setIsRunning(false);
                            if (onComplete) onComplete();
                        }
                    }
                    if (onTick) onTick(next);
                    return next;
                });
            }, 10);
        }
        return () => clearInterval(interval);
    }, [isRunning, onTick, mode, onComplete]);

    const toggleTimer = () => {
        const nextState = !isRunning;
        setIsRunning(nextState);
        if (nextState && onStart) onStart();
        if (!nextState && onPause) onPause();
    };

    const resetTimer = () => {
        setIsRunning(false);
        const resetVal = mode === 'stopwatch' ? 0 : duration;
        setTime(resetVal);
        if (onReset) onReset(resetVal);
    };

    const formatTime = (msTime) => {
        const totalSeconds = Math.floor(msTime / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        const ms = Math.floor((msTime % 1000) / 10);

        if (h > 0) {
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
    };

    // Calculate progress for circular ring
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const progress = mode === 'stopwatch' ? 0 : (time / duration);
    const offset = mode === 'stopwatch' ? 0 : circumference - (progress * circumference);

    return (
        <div className={`flex flex-col items-center justify-center space-y-8 ${minimal ? 'w-full' : 'bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100'}`}>
            <div className="relative flex items-center justify-center">
                {/* Progress Ring */}
                <svg className="transform -rotate-90 w-72 h-72">
                    <circle
                        cx="144"
                        cy="144"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-100"
                    />
                    {mode === 'pomodoro' && (
                        <circle
                            cx="144"
                            cy="144"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            style={{
                                strokeDashoffset: offset,
                                transition: 'stroke-dashoffset 0.1s linear'
                            }}
                            className={`${isRunning ? 'text-indigo-600' : 'text-indigo-300'}`}
                        />
                    )}
                </svg>

                {/* Time Display */}
                <div className="absolute flex flex-col items-center">
                    <div className={`font-mono font-black tracking-tighter tabular-nums transition-all duration-300 ${minimal ? 'text-6xl' : 'text-5xl'} ${isRunning ? 'text-indigo-600 scale-105' : 'text-gray-900 group-hover:text-indigo-400'}`}>
                        {formatTime(time)}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mt-2">
                        {mode === 'pomodoro' ? 'Focus Cycle' : 'Elapsed Time'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <button
                    onClick={toggleTimer}
                    className={`w-20 h-20 rounded-full text-white shadow-2xl transition-all transform hover:scale-110 active:scale-90 flex items-center justify-center ${isRunning
                            ? 'bg-rose-500 shadow-rose-200'
                            : 'bg-indigo-600 shadow-indigo-200'
                        }`}
                >
                    {isRunning ? <Pause size={32} fill="white" /> : <Play size={32} className="ml-1" fill="white" />}
                </button>
                <button
                    onClick={resetTimer}
                    className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all flex items-center justify-center"
                    title="Reset Timer"
                >
                    <RotateCcw size={24} />
                </button>
            </div>
        </div>
    );
}
