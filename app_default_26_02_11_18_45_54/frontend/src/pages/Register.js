import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });

  const calculatePasswordStrength = (password) => {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Moyen', color: 'bg-yellow-500' };
    return { score, label: 'Fort', color: 'bg-green-500' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!form.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis';
    } else if (form.fullName.length < 2) {
      newErrors.fullName = 'Minimum 2 caractères';
    }
    
    if (!form.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (form.username.length < 3) {
      newErrors.username = 'Minimum 3 caractères';
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newErrors.username = 'Caractères alphanumériques uniquement';
    }
    
    if (!form.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email invalide';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    
    if (!form.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (form.password.length < 8) {
      newErrors.password = 'Minimum 8 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
    } else {
      if (validateStep2()) {
        try {
          await axios.post('/auth/register', form);
          setMessage('Compte créé avec succès !');
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        } catch (err) {
          // Handle different types of errors
          if (err.response) {
            const errorMessage = err.response.data.message || err.response.data.error;
            
            if (errorMessage && errorMessage.toLowerCase().includes('username')) {
              setMessage('Ce nom d\'utilisateur est déjà utilisé');
            } else if (errorMessage && errorMessage.toLowerCase().includes('email')) {
              setMessage('Cet email est déjà utilisé');
            } else if (errorMessage && errorMessage.toLowerCase().includes('exists')) {
              setMessage('Ce nom d\'utilisateur ou cet email est déjà utilisé');
            } else {
              setMessage('Erreur lors de la création du compte');
            }
          } else {
            setMessage('Erreur de connexion, veuillez réessayer');
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-2 sm:p-4 relative overflow-hidden mobile-full-width" style={{ backgroundImage: 'url("/logo2.png")' }}>
      {/* Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md border border-white/20 relative z-10 mobile-card">
        {/* Glassmorphism card */}
        <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 border border-white/10">
          {/* Progress Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm font-semibold text-white/90 mobile-text-xs">Étape {step} sur 2</span>
              <span className="text-xs sm:text-sm text-white/70 mobile-text-xs">
                {step === 1 ? 'Informations' : 'Sécurité'}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 sm:h-3 backdrop-blur-sm">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 sm:h-3 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>

          {/* Logo */}
          

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 text-center mobile-text-sm">
            {step === 1 ? 'Créer votre compte' : 'Sécurisez votre compte'}
          </h2>
          <p className="text-white/70 text-center mb-6 sm:mb-8 text-sm sm:text-base mobile-text-xs">
            {step === 1 ? 'Entrez vos informations personnelles' : 'Choisissez un mot de passe sécurisé'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {step === 1 ? (
            <>
              <div className="group">
                <label className="block text-sm font-semibold text-white/90 mb-2 transition-all duration-300 group-focus-within:text-blue-300">
                  Nom complet
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/50 group-focus-within:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Jean Dupont"
                    value={form.fullName}
                    onChange={e => {
                      handleChange(e);
                      if (errors.fullName) {
                        setErrors({...errors, fullName: ''});
                      }
                    }}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 ${
                      errors.fullName ? 'border-red-400 focus:ring-red-400' : 'border-white/20'
                    }`}
                    required
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-300 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.fullName}
                  </p>
                )}
              </div>
              
              <div className="group">
                <label className="block text-sm font-semibold text-white/90 mb-2 transition-all duration-300 group-focus-within:text-blue-300">
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/50 group-focus-within:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="username"
                    placeholder="jdupont"
                    value={form.username}
                    onChange={e => {
                      handleChange(e);
                      if (errors.username) {
                        setErrors({...errors, username: ''});
                      }
                    }}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 ${
                      errors.username ? 'border-red-400 focus:ring-red-400' : 'border-white/20'
                    }`}
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
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-white/50 group-focus-within:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="jean.dupont@email.com"
                    value={form.email}
                    onChange={e => {
                      handleChange(e);
                      if (errors.email) {
                        setErrors({...errors, email: ''});
                      }
                    }}
                    className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 ${
                      errors.email ? 'border-red-400 focus:ring-red-400' : 'border-white/20'
                    }`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-300 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
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
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => {
                      handleChange(e);
                      if (errors.password) {
                        setErrors({...errors, password: ''});
                      }
                    }}
                    className={`w-full pl-12 pr-12 py-3 bg-white/10 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-white placeholder-white/50 backdrop-blur-sm hover:bg-white/15 ${
                      errors.password ? 'border-red-400 focus:ring-red-400' : 'border-white/20'
                    }`}
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
                
                {/* Password Strength Indicator */}
                {form.password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/70">Force du mot de passe</span>
                      <span className={`text-xs font-semibold ${
                        passwordStrength.color === 'bg-red-500' ? 'text-red-300' :
                        passwordStrength.color === 'bg-yellow-500' ? 'text-yellow-300' :
                        'text-green-300'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 shadow-lg ${
                          passwordStrength.color === 'bg-red-500' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                          passwordStrength.color === 'bg-yellow-500' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                          'bg-gradient-to-r from-green-400 to-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/60 mt-2">
                      {form.password.length < 8 
                        ? 'Minimum 8 caractères requis' 
                        : '✓ Longueur minimale atteinte'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Password Requirements */}
              <div className="bg-white/10 rounded-xl p-4 space-y-2 backdrop-blur-sm border border-white/10">
                <p className="text-sm font-semibold text-white/90 mb-3">Pour un mot de passe fort:</p>
                <div className="space-y-2">
                  <div className="flex items-center text-xs text-white/70">
                    <span className={form.password.length >= 8 ? 'text-green-300' : ''}>
                      {form.password.length >= 8 ? '✓' : '○'}
                    </span>
                    <span className="ml-2">Au moins 8 caractères</span>
                  </div>
                  <div className="flex items-center text-xs text-white/70">
                    <span className={/[a-z]/.test(form.password) && /[A-Z]/.test(form.password) ? 'text-green-300' : ''}>
                      {/[a-z]/.test(form.password) && /[A-Z]/.test(form.password) ? '✓' : '○'}
                    </span>
                    <span className="ml-2">Majuscules et minuscules</span>
                  </div>
                  <div className="flex items-center text-xs text-white/70">
                    <span className={/[0-9]/.test(form.password) ? 'text-green-300' : ''}>
                      {/[0-9]/.test(form.password) ? '✓' : '○'}
                    </span>
                    <span className="ml-2">Au moins un chiffre</span>
                  </div>
                  <div className="flex items-center text-xs text-white/70">
                    <span className={/[^a-zA-Z0-9]/.test(form.password) ? 'text-green-300' : ''}>
                      {/[^a-zA-Z0-9]/.test(form.password) ? '✓' : '○'}
                    </span>
                    <span className="ml-2">Caractère spécial</span>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="flex gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-300 font-semibold backdrop-blur-sm transform hover:scale-105"
              >
                Retour
              </button>
            )}
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden group"
            >
              <span className="relative z-10">{step === 1 ? 'Continuer' : 'Créer le compte'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full blur-lg opacity-50"></div>
            </button>
          </div>
        </form>
        
        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center backdrop-blur-sm border ${
            message.includes('succès') 
              ? 'bg-green-500/20 text-green-100 border-green-400/30' 
              : 'bg-red-500/20 text-red-100 border-red-400/30'
          }`}>
            {message}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm text-white/70">
            Vous avez déjà un compte ?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-300 hover:text-blue-200 font-semibold transition-colors"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
