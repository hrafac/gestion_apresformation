import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Tag, Users, Clock, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

const MesFormations = () => {
    const [formations, setFormations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchFormations = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/training/participant/${user.id}`);
                setFormations(response.data.formations);
                setError(null);
            } catch (err) {
                setError('Erreur lors de la récupération de vos formations');
                console.error('Erreur:', err);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.id) {
            fetchFormations();
        }
    }, [user]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        if (end > now) {
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        }
        return 'bg-slate-100 text-slate-800 border-slate-200';
    };

    const getStatusText = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        return end > now ? 'À venir' : 'Terminée';
    };

    const getStatusIcon = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        return end > now ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex justify-center items-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Chargement de vos formations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex justify-center items-center px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-red-100">
                    <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Oups !</h3>
                    <p className="text-gray-600 text-center">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Mes Formations
                            </h1>
                            <p className="mt-3 text-lg text-gray-600">
                                Suivez votre progression et consultez les formations auxquelles vous êtes inscrit
                            </p>
                        </div>
                        <div className="bg-blue-50 rounded-xl px-6 py-3 border border-blue-200">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-blue-900">{formations.length}</span>
                                <span className="text-blue-700">formation{formations.length > 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {formations.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
                            <BookOpen className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune formation trouvée</h3>
                        <p className="text-gray-600 text-lg mb-6">
                            Vous n'êtes actuellement inscrit à aucune formation.
                        </p>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                            <p className="text-blue-800 font-medium">
                                💡 Contactez votre administrateur pour vous inscrire à une formation
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
                        {formations.map((formation, index) => (
                            <div 
                                key={formation.id} 
                                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                {/* Header Card */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusColor(formation.endDateTime)}`}>
                                                {getStatusIcon(formation.endDateTime)}
                                                {getStatusText(formation.endDateTime)}
                                            </span>
                                           
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                            {formation.title}
                                        </h3>
                                        <div className="flex items-center text-blue-100 text-sm">
                                            <Tag className="w-4 h-4 mr-2" />
                                            {formation.theme}
                                        </div>
                                    </div>
                                </div>

                                {/* Body Card */}
                                <div className="p-6 space-y-4">
                                    {/* Location */}
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Lieu</p>
                                            <p className="text-sm text-gray-600">{formation.location}</p>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0">
                                            <Calendar className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 mb-1">Dates</p>
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                    Début: {formatDate(formation.startDateTime)}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                                    Fin: {formatDate(formation.endDateTime)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                  
                                    {/* Trainer */}
                                    {formation.trainer && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold">
                                                        {formation.trainer.username.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Formateur</p>
                                                    <p className="text-sm font-medium text-gray-900">{formation.trainer.username}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Card */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        
                                        <div className="flex items-center gap-1 text-blue-600 group-hover:text-blue-700 transition-colors">
                                            <span className="text-xs font-medium">Voir détails</span>
                                            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MesFormations;
