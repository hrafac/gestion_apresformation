import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Search, X, Moon, Bell, ChevronDown, ChevronRight, Menu, Grid3x3, Bot, ShoppingCart, Calendar, Users, CheckSquare, FileText, Layout, MessageSquare, HelpCircle, Mail, BarChart3, Palette, Shield, GraduationCap, UserCog, TrendingUp, UserCheck, Users2, UserSearch } from 'lucide-react';

const Navbar = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Grid3x3, path: '/', adminOnly: true },
        { id: 'formation', label: 'Formation', icon: GraduationCap, path: '/formations', adminOnly: true },
        { id: 'gestion-utilisateurs', label: 'Gestion des utilisateurs', icon: UserCog, path: '/users', adminOnly: true },
        { id: 'participants-details', label: 'Participants Details', icon: UserCheck, path: '/participants-details', rhOnly: true },
        { id: 'participant-count-by-training', label: 'Participants Count', icon: Users2, path: '/participant-count-by-training', rhOnly: true },
        { id: 'training-analytics', label: 'Training Analytics', icon: BarChart3, path: '/training-analytics', rhOnly: true },
        { id: 'participant-formation-analysis', label: 'Participant Analysis', icon: UserSearch, path: '/participant-formation-analysis', rhOnly: true },
        { id: 'analyse', label: 'Analyse', icon: TrendingUp, path: '/analytics', adminOnly: true },
        { id: 'tous-formation', label: 'Tous les Formations', icon: GraduationCap, path: '/formations', participantOnly: true },
        { id: 'mes-formations', label: 'Mes Formations', icon: GraduationCap, path: '/mes-formations', participantOnly: true },
        { id: 'questionnaire-froid', label: 'Questionnaire Froid', icon: FileText, path: '/questionnaire-froid', participantOnly: true },
        { id: 'formateur-formations', label: 'Mes Formations (Formateur)', icon: GraduationCap, path: '/formateur-formations', trainerOnly: true },
    ];

    const handleNavClick = (item) => {
        navigate(item.path);
    };

    const getActiveNav = () => {
        const currentPath = location.pathname;
        const activeItem = navItems.find(item => item.path === currentPath);
        return activeItem ? activeItem.id : 'dashboard';
    };

    const activeNav = getActiveNav();

    const isParticipant = user && user.role === 'PARTICIPANT';
    const isAdmin = user && user.role === 'ADMIN';
    const isTrainer = user && user.role === 'TRAINER';
    const isRH = user && user.role === 'RH';

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {isParticipant ? (
                // Navbar horizontale pour PARTICIPANT
                <>
                    <header className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <img 
                                    src="/logo4.png" 
                                    alt="Logo" 
                                    className="w-40 h-12 object-contain"
                                />
                                <nav className="flex items-center gap-6">
                                    {navItems.filter((item) => {
                                        if (item.adminOnly || item.rhOnly) {
                                            return false;
                                        }
                                        if (item.participantOnly) {
                                            return true;
                                        }
                                        return false;
                                    }).map((item) => {
                                        const Icon = item.icon;
                                        const isActive = activeNav === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleNavClick(item)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                            >
                                                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                                                <span className="font-medium">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Moon size={20} className="text-gray-600" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                                    <Bell size={20} className="text-gray-600" />
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                </button>
                                {user && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                            <UserIcon size={16} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{user.fullName}</p>
                                            <ChevronDown size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={logout}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Déconnexion"
                                >
                                    <LogOut size={20} className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 p-6 overflow-y-auto">
                        {children}
                    </main>
                </>
            ) : isTrainer ? (
                // Navbar horizontale pour TRAINER
                <>
                    <header className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-8">
                                <img 
                                    src="/logo4.png" 
                                    alt="Logo" 
                                    className="w-40 h-12 object-contain"
                                />
                                <nav className="flex items-center gap-6">
                                    {navItems.filter((item) => {
                                        if (item.adminOnly || item.rhOnly) {
                                            return false;
                                        }
                                        if (item.trainerOnly) {
                                            return true;
                                        }
                                        return false;
                                    }).map((item) => {
                                        const Icon = item.icon;
                                        const isActive = activeNav === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleNavClick(item)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                }`}
                                            >
                                                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                                                <span className="font-medium">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Moon size={20} className="text-gray-600" />
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                                    <Bell size={20} className="text-gray-600" />
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                </button>
                                {user && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                            <UserIcon size={16} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{user.fullName}</p>
                                            <ChevronDown size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={logout}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Déconnexion"
                                >
                                    <LogOut size={20} className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 p-6 overflow-y-auto">
                        {children}
                    </main>
                </>
            ) : (
                // Layout avec sidebar pour ADMIN et RH
                <div className="flex flex-1">
                    {/* Sidebar */}
                    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
                        {/* Logo Section */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                {sidebarOpen ? (
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src="/logo4.png" 
                                            alt="Logo" 
                                            className="w-60 h-20 object-contain"
                                        />
                                    </div>
                                ) : (
                                    <img 
                                        src="/logo4.png" 
                                        alt="Logo" 
                                        className="w-30 h-50 object-contain mx-auto"
                                    />
                                )}
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Menu size={20} className="text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-1">
                                {navItems.filter((item) => {
                                    if (item.adminOnly) {
                                        return user && user.role === 'ADMIN';
                                    }
                                    if (item.rhOnly) {
                                        return user && user.role === 'RH';
                                    }
                                    if (item.participantOnly) {
                                        return false;
                                    }
                                    if (item.trainerOnly) {
                                        return user && user.role === 'TRAINER';
                                    }
                                    return true;
                                }).map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeNav === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNavClick(item)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        >
                                            <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                                            {sidebarOpen && (
                                                <>
                                                    <span className="flex-1 text-left font-medium">{item.label}</span>
                                                    {item.badge && (
                                                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                    {item.hasDropdown && (
                                                        <ChevronRight size={16} className="text-gray-400" />
                                                    )}
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* User Section */}
                        {sidebarOpen && user && (
                            <div className="p-4 border-t border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                        <UserIcon size={20} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{user.fullName}</p>
                                        <p className="text-sm text-gray-500">{user.role}</p>
                                    </div>
                                    <ChevronDown size={16} className="text-gray-400" />
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col">
                        {/* Top Bar */}
                        <header className="bg-white border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <Moon size={20} className="text-gray-600" />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                                        <Bell size={20} className="text-gray-600" />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    </button>
                                    {user && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                                <UserIcon size={16} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{user.fullName}</p>
                                                <ChevronDown size={16} className="text-gray-400" />
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={logout}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Déconnexion"
                                    >
                                        <LogOut size={20} className="text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </header>

                        {/* Page Content */}
                        <main className="flex-1 p-6 overflow-y-auto">
                            {children}
                        </main>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;
