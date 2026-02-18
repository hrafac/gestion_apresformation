import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Search, X, Moon, Bell, ChevronDown, ChevronRight, Menu, Grid3x3, Bot, ShoppingCart, Calendar, Users, CheckSquare, FileText, Layout, MessageSquare, HelpCircle, Mail, BarChart3, Palette, Shield, GraduationCap, UserCog, TrendingUp } from 'lucide-react';

const Navbar = ({ children }) => {
    const { user, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeNav, setActiveNav] = useState('dashboard');

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: Grid3x3 },
        { id: 'formation', label: 'Formation', icon: GraduationCap },
        { id: 'gestion-utilisateurs', label: 'Gestion des utilisateurs', icon: UserCog },
        { id: 'analyse', label: 'Analyse', icon: TrendingUp },
        
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
                {/* Logo Section */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        {sidebarOpen ? (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">TA</span>
                                </div>
                                <span className="font-bold text-xl text-gray-800">TailAdmin</span>
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto">
                                <span className="text-white font-bold text-sm">TA</span>
                            </div>
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
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeNav === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveNav(item.id)}
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
    );
};

export default Navbar;