import { LayoutDashboard, List, PieChart, Timer, Map, CheckSquare, Clock, History as HistoryIcon, Zap, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar({ active, setActive, onLogout, user }) {
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

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 md:static md:w-64 md:border-r md:h-screen shadow-md md:shadow-none z-50">
            <div className="flex justify-around md:flex-col md:justify-start md:p-4 md:space-y-2 h-16 md:h-auto items-center md:items-stretch h-full">
                <div className="hidden md:flex items-center gap-3 px-4 mb-8">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                        <Zap size={20} fill="white" />
                    </div>
                    <span className="text-xl font-black text-slate-800 tracking-tight">GoalTracker</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 md:pr-2 scrollbar-hide">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActive(item.id)}
                                className={`flex flex-col md:flex-row items-center md:space-x-3 p-2 md:px-4 md:py-3 rounded-2xl transition-all ${active === item.id
                                    ? 'text-indigo-600 bg-indigo-50 font-black shadow-sm'
                                    : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon size={20} className={active === item.id ? 'stroke-[3]' : ''} />
                                <span className="text-[10px] md:text-sm uppercase tracking-wider md:normal-case md:tracking-normal font-bold">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Operator Profile & Logout */}
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
    );
}
