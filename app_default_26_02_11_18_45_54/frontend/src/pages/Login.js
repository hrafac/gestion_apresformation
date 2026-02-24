import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {};
        
        if (!credentials.username.trim()) {
            newErrors.username = 'Le nom d\'utilisateur est requis';
        } else if (credentials.username.length < 3) {
            newErrors.username = 'Minimum 3 caractères';
        }
        
        if (!credentials.password) {
            newErrors.password = 'Le mot de passe est requis';
        } else if (credentials.password.length < 6) {
            newErrors.password = 'Minimum 6 caractères';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        try {
            const res = await api.post('/auth/login', credentials);
            login(res.data.user, res.data.token);
            
            // Navigate based on user role
            if (res.data.user.role === 'PARTICIPANT') {
                navigate('/formations');
            } else {
                navigate('/');
            }
        } catch (err) {
            alert('Identifiants invalides');
        }
    };

    return (
        <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundImage: 'url("/logo2.png")' }}>
            {/* Overlay for better text visibility */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 relative z-10">
                {/* Glassmorphism card */}
                <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                    {/* Logo */}
                    

                    <h2 className="text-3xl font-bold text-white mb-2 text-center">Connexion</h2>
                    <p className="text-white/70 text-center mb-8">Accédez à votre espace personnel</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="group">
                        <label className="block text-sm font-semibold text-white/90 mb-2 transition-all duration-300 group-focus-within:text-blue-300">
                            Utilisateur
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-white/50 group-focus-within:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Entrez votre nom d'utilisateur"
                                className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 ${
                                    errors.username ? 'border-red-400 focus:ring-red-400' : 'border-white/20'
                                }`}
                                onChange={e => {
                                    setCredentials({...credentials, username: e.target.value});
                                    if (errors.username) {
                                        setErrors({...errors, username: ''});
                                    }
                                }}
                                value={credentials.username}
                                required
                            />
                        </div>
                        {errors.username && (
                            <p className="mt-1 text-xs text-red-300 flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.username}
                            </p>
                        )}
                    </div>
                    
                    <div className="group">
                        <label className="block text-sm font-semibold text-white/90 mb-2 transition-all duration-300 group-focus-within:text-blue-300">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-white/50 group-focus-within:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Entrez votre mot de passe"
                                className={`w-full pl-12 pr-12 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 ${
                                    errors.password ? 'border-red-400 focus:ring-red-400' : 'border-white/20'
                                }`}
                                onChange={e => {
                                    setCredentials({...credentials, password: e.target.value});
                                    if (errors.password) {
                                        setErrors({...errors, password: ''});
                                    }
                                }}
                                value={credentials.password}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white/70 transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-300 flex items-center">
                                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errors.password}
                            </p>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2 text-white/70 hover:text-white/90 transition-colors cursor-pointer">
                            <input type="checkbox" className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-400 focus:ring-2" />
                            <span className="text-sm">Se souvenir de moi</span>
                        </label>
                        <button type="button" className="text-sm text-blue-300 hover:text-blue-200 transition-colors">
                            Mot de passe oublié?
                        </button>
                    </div>
                    
                    <button 
                        type="submit"
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden group"
                    >
                        <span className="relative z-10">Se connecter</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </button>
                </form>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-white/70">
                        Pas encore de compte ?{' '}
                        <button
                            onClick={() => navigate('/register')}
                            className="text-blue-300 hover:text-blue-200 font-semibold transition-colors"
                        >
                            S'inscrire
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
