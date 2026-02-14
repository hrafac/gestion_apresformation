import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-marsa-blue text-white p-4 flex justify-between items-center">
            <div className="text-2xl font-bold">Marsa Maroc Eval</div>
            <div className="flex items-center gap-6">
                {user && (
                    <>
                        <div className="flex items-center gap-2">
                            <UserIcon size={20} />
                            <span>{user.fullName} ({user.role})</span>
                        </div>
                        <button onClick={logout} className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded hover:bg-red-700">
                            <LogOut size={18} /> Quitter
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
