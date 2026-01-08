import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { User, Lock, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';

export default function Auth({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await axios.post(`${API_BASE_URL}${endpoint}`, { username, password });

            if (isLogin) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                onLogin(res.data.user);
            } else {
                setIsLogin(true);
                setError('Mission account created! Please sign in.');
                setConfirmPassword('');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed. Please verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px] animate-pulse"></div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-6 group cursor-pointer transition-all hover:scale-110 active:scale-95">
                        <Shield size={32} fill="white" className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                        GoalTracker <span className="text-indigo-600">Pro</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Secure Mission Control Access</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 overflow-hidden relative">

                    {/* Tabs */}
                    <div className="flex p-2 bg-slate-100/50 gap-1 rounded-t-[2.5rem]">
                        <button
                            onClick={() => { setIsLogin(true); setError(''); }}
                            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError(''); }}
                            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <div className="p-10">
                        {error && (
                            <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in slide-in-from-top duration-300 ${error.includes('created') ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                <div className={`w-2 h-2 rounded-full ${error.includes('created') ? 'bg-emerald-500' : 'bg-rose-500'} animate-ping`}></div>
                                <span className="text-xs font-black uppercase tracking-tight">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Operator Identity</label>
                                <div className="group relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        placeholder="Email Address"
                                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Secure Passcode</label>
                                <div className="group relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password (Signup only) */}
                            {!isLogin && (
                                <div className="space-y-2 animate-in slide-in-from-top duration-300">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Retype Passcode</label>
                                    <div className="group relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            placeholder="••••••••"
                                            className="block w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all font-bold"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full relative group"
                            >
                                <div className="absolute -inset-1 bg-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative flex items-center justify-center w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-slate-900 shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 disabled:active:scale-100 overflow-hidden">
                                    {loading ? (
                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            {isLogin ? 'Initialize System' : 'Create Credentials'}
                                            <ArrowRight size={16} />
                                        </span>
                                    )}
                                </div>
                            </button>
                        </form>

                        {/* Footer decorative metrics */}
                        <div className="mt-12 pt-8 border-t border-slate-50 flex justify-between items-center opacity-40">
                            <div className="flex items-center gap-2">
                                <Zap size={14} className="text-amber-500" />
                                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">Fast Sync</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className="text-indigo-500" />
                                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500">Premium UI</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Notice */}
                <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest px-8">
                    Mission Control v3.0 // Secure Encryption Active
                </p>
            </div>
        </div>
    );
}
