import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ParticipantsDetails = () => {
    const { user } = useAuth();
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedParticipant, setExpandedParticipant] = useState(null);
    const [expandedTraining, setExpandedTraining] = useState({});

    useEffect(() => {
        if (user?.role !== 'RH') {
            return;
        }

        const fetchParticipants = async () => {
            try {
                const response = await api.get('/participants/with-trainings-and-responses');
                setParticipants(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des participants:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchParticipants();
    }, [user]);

    const toggleParticipant = (participantId) => {
        setExpandedParticipant(expandedParticipant === participantId ? null : participantId);
    };

    const toggleTraining = (trainingId) => {
        setExpandedTraining(prev => ({
            ...prev,
            [trainingId]: !prev[trainingId]
        }));
    };

    if (user?.role !== 'RH') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 text-center max-w-md w-full">
                    <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">Accès Restreint</h2>
                    <p className="text-gray-600 text-lg leading-relaxed">Cette page est réservée au rôle RH</p>
                    <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-sm text-amber-800">Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-white/20">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto mb-6"></div>
                            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-blue-400 animate-pulse mx-auto"></div>
                        </div>
                        <p className="text-xl font-semibold text-gray-700 mb-2">Chargement en cours...</p>
                        <p className="text-gray-500">Récupération des participants et de leurs formations</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center mb-4">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl mr-4 shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                        Participants et Formations
                                    </h1>
                                    <p className="text-gray-600 mt-2 text-lg">Détails des participants, leurs formations et réponses</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-8 py-6 rounded-2xl shadow-xl border border-white/20">
                            <div className="text-center">
                                <p className="text-sm font-medium uppercase tracking-wider opacity-90">Total Participants</p>
                                <p className="text-3xl font-bold mt-1">{participants.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liste des participants */}
                <div className="space-y-6">
                    {participants.map((participant) => (
                        <div key={participant.id} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-300">
                            {/* En-tête participant */}
                            <div 
                                className="p-8 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300"
                                onClick={() => toggleParticipant(participant.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-6">
                                        <div className="relative">
                                            <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                                                {participant.fullName?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-1">{participant.fullName}</h3>
                                            <div className="flex items-center space-x-3">
                                                <span className="text-sm text-gray-600 flex items-center">
                                                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    @{participant.username}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-8">
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</p>
                                            <p className="text-sm font-semibold text-gray-700">{participant.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Formations</p>
                                            <div className="flex items-center justify-end">
                                                <span className="text-2xl font-bold text-blue-600">{participant.trainings.length}</span>
                                                <svg className="w-5 h-5 ml-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Réponses</p>
                                            <div className="flex items-center justify-end">
                                                <span className="text-2xl font-bold text-green-600">
                                                    {participant.trainings.reduce((total, training) => total + training.responses.length, 0)}
                                                </span>
                                                <svg className="w-5 h-5 ml-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl shadow-md border border-gray-200">
                                            <svg 
                                                className={`w-6 h-6 text-blue-500 transform transition-transform duration-300 ${expandedParticipant === participant.id ? 'rotate-180' : ''}`}
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Détails des formations */}
                            {expandedParticipant === participant.id && (
                                <div className="border-t border-gray-200/50 bg-gradient-to-b from-gray-50/50 to-white/50">
                                    <div className="p-8 space-y-4">
                                        {participant.trainings.map((training) => (
                                            <div key={training.id} className="bg-white rounded-xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                                                {/* En-tête formation */}
                                                <div 
                                                    className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-300"
                                                    onClick={() => toggleTraining(training.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                                                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                                    </svg>
                                                                </div>
                                                                {training.title}
                                                            </h4>
                                                            <div className="flex items-center space-x-6">
                                                                <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg">
                                                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                    </svg>
                                                                    <span className="text-sm font-medium text-purple-700">{training.theme}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    <span className="text-sm font-medium text-green-700">{training.location}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
                                                                training.status === 'TERMINE' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                                                                training.status === 'EN_COURS' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
                                                                'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
                                                            }`}>
                                                                {training.status}
                                                            </span>
                                                            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                                                                <span className="text-sm font-bold text-blue-700">
                                                                    {training.responses.length} réponse(s)
                                                                </span>
                                                            </div>
                                                            <div className="bg-white p-2 rounded-lg shadow-md border border-gray-200">
                                                                <svg 
                                                                    className={`w-5 h-5 text-blue-500 transform transition-transform duration-300 ${expandedTraining[training.id] ? 'rotate-180' : ''}`}
                                                                    fill="none" 
                                                                    stroke="currentColor" 
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Détails des réponses */}
                                                {expandedTraining[training.id] && (
                                                    <div className="border-t border-gray-200/50 bg-gradient-to-b from-blue-50/30 to-white p-6">
                                                        {training.responses.length === 0 ? (
                                                            <div className="text-center py-8">
                                                                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                                    </svg>
                                                                </div>
                                                                <p className="text-gray-500 font-medium">Aucune réponse pour cette formation</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                {training.responses.map((response, index) => (
                                                                    <div key={response.id} className="bg-white rounded-xl p-4 border border-gray-200/50 shadow-md hover:shadow-lg transition-all duration-300">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center justify-between mb-3">
                                                                                    <div className="flex items-center space-x-3">
                                                                                        <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-bold">
                                                                                            Question #{response.questionId}
                                                                                        </div>
                                                                                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                            </svg>
                                                                                            <span className="font-medium">
                                                                                                {new Date(response.submittedAt).toLocaleDateString('fr-FR', {
                                                                                                    day: 'numeric',
                                                                                                    month: 'short',
                                                                                                    year: 'numeric',
                                                                                                    hour: '2-digit',
                                                                                                    minute: '2-digit'
                                                                                                })}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-lg border border-gray-200">
                                                                                    <p className="text-gray-800 leading-relaxed">{response.value}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {participant.trainings.length === 0 && (
                                            <div className="text-center py-12">
                                                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500 font-medium text-lg">Ce participant n'est inscrit à aucune formation</p>
                                                <p className="text-gray-400 text-sm mt-2">Les formations apparaîtront ici une fois que le participant sera inscrit</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {participants.length === 0 && (
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-16 text-center">
                        <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-4">Aucun participant trouvé</h3>
                        <p className="text-gray-500 text-lg max-w-md mx-auto leading-relaxed">Il n'y a aucun participant avec des formations dans le système</p>
                        <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 max-w-sm mx-auto">
                            <p className="text-sm text-blue-800 font-medium">Vérifiez que les participants sont bien inscrits à des formations pour voir leurs détails ici.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantsDetails;
