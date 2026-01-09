import { useState } from 'react';
import { LayoutDashboard, List, PieChart, Timer, Map, CheckSquare, Clock, History as HistoryIcon, Zap, LogOut, User as UserIcon, Menu, X } from 'lucide-react';

export default function Navbar({ active, setActive, onLogout, user }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'roadmap', label: 'Roadmap', icon: Map },
        { id: 'todo', label: 'Todo', icon: CheckSquare },
        { id: 'timer', label: 'Study Timer', icon: Clock },
        { id: 'logs', label: 'Daily Logs', icon: List },
        { id: 'history', label: 'History', icon: HistoryIcon },
        { id: 'priorities', label: 'Daily Briefing', icon: Zap },
        { id: 'summary', label: 'Summary', icon: PieChart },
    ];

    const handleNavClick = (id) => {
        setActive(id);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Top Navbar */}
            <div className="md:hidden fixed top-0 left-0 w-full bg-white border-b border-gray-200 z-50 h-16 flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-100">
                            <Zap size={18} fill="white" />
                        </div>
                        <span className="text-lg font-black text-slate-800 tracking-tight">GoalTracker</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-black text-sm">
                        {user?.username?.[0].toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>

                    {/* Drawer */}
                    <div className="absolute top-0 left-0 w-3/4 max-w-xs h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-100">
                                    <Zap size={18} fill="white" />
                                </div>
                                <span className="text-xl font-black text-slate-800 tracking-tight">Menu</span>
                            </div>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.id)}
                                        className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all ${active === item.id
                                            ? 'text-indigo-600 bg-indigo-50 font-black shadow-sm'
                                            : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 font-medium'
                                            }`}
                                    >
                                        <Icon size={22} className={active === item.id ? 'stroke-[3]' : ''} />
                                        <span className="text-base">{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-slate-50">
                            <div className="flex items-center gap-3 px-2 mb-4">
                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                    {user?.username?.[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Signed in as</p>
                                    <p className="text-sm font-black text-slate-700 truncate">{user?.username}</p>
                                </div>
                            </div>
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-2xl transition-all font-bold text-sm shadow-sm"
                            >
                                <LogOut size={18} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Navigation (Desktop Sidebar) */}
            <nav className="hidden md:flex fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 md:static md:w-64 md:border-r md:h-screen shadow-md md:shadow-none z-50">
                <div className="flex flex-col md:flex-col justify-start md:p-4 md:space-y-2 h-full w-full">
                    {/* Desktop Brand Header */}
                    <div className="hidden md:flex items-center gap-3 px-4 mb-8">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                            <Zap size={20} fill="white" />
                        </div>
                        <span className="text-xl font-black text-slate-800 tracking-tight">GoalTracker</span>
                    </div>

                    {/* Desktop Vertical List */}
                    <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto space-x-2 md:space-x-0 md:space-y-1 p-2 md:pr-2 scrollbar-hide w-full">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActive(item.id)}
                                    className={`flex flex-col md:flex-row items-center justify-center md:justify-start md:space-x-3 p-2 md:px-4 md:py-3 rounded-2xl transition-all min-w-[70px] md:min-w-0 ${active === item.id
                                        ? 'text-indigo-600 bg-indigo-50 font-black shadow-sm'
                                        : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon size={20} className={`mb-1 md:mb-0 ${active === item.id ? 'stroke-[3]' : ''}`} />
                                    <span className="text-[9px] md:text-sm uppercase tracking-wider md:normal-case md:tracking-normal font-bold whitespace-nowrap">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Desktop Operator Profile & Logout */}
                    <div className="hidden md:block pt-6 mt-6 border-t border-slate-100 px-2">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl mb-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                {user?.username?.[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Operator</p>
                                <p className="text-sm font-black text-slate-700 truncate">{user?.username}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-bold text-sm group"
                        >
                            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </nav>
            {/* Mobile Bottom Bar (Optional - keeping for quick access if desired, usually one or the other but hybrid is fine. User asked for hamburger, so drawer is focus. I will HIDE the bottom bar to avoid clutter if the user specifically asked for "this type of toggle" showing "remaining pages". The image shows a drawer icon. Usually this REPLACES the bottom bar or complements it. The user said "show remaining pages" implying they couldn't see them. The horizontal scroll solved that, but they prefer drawer. I will KEEP the bottom bar HIDDEN on mobile now to force use of the drawer, or keep it? The prompt says "creating a mess... show only 5 pages...". I'll HIDE the bottom nav on mobile to clean it up and rely fully on the drawer as requested.)
            Actually, looking at the code I wrote above, I wrapped the 'nav' in 'hidden md:flex'. This effectively REMOVES the bottom/side bar from mobile view, leaving ONLY the Top Bar + Drawer. This matches the user's "cleaner" request for a toggle. */}
        </>
    );
}
