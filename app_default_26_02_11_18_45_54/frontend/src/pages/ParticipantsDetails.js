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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès Restreint</h2>
                    <p className="text-gray-600">Cette page est réservée au rôle RH</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marsa-blue mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des participants...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                                <svg className="w-8 h-8 mr-3 text-marsa-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Participants et Formations
                            </h1>
                            <p className="text-gray-600 mt-2">Détails des participants, leurs formations et réponses</p>
                        </div>
                        <div className="bg-marsa-blue text-white px-6 py-3 rounded-lg">
                            <p className="text-sm font-medium">Total Participants</p>
                            <p className="text-2xl font-bold">{participants.length}</p>
                        </div>
                    </div>
                </div>

                {/* Liste des participants */}
                <div className="space-y-4">
                    {participants.map((participant) => (
                        <div key={participant.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            {/* En-tête participant */}
                            <div 
                                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleParticipant(participant.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-marsa-orange text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                                            {participant.fullName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">{participant.fullName}</h3>
                                            <p className="text-sm text-gray-600">@{participant.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-6">
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="text-sm font-medium">{participant.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Formations</p>
                                            <p className="text-lg font-bold text-marsa-blue">{participant.trainings.length}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Total Réponses</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {participant.trainings.reduce((total, training) => total + training.responses.length, 0)}
                                            </p>
                                        </div>
                                        <svg 
                                            className={`w-6 h-6 text-gray-400 transform transition-transform ${expandedParticipant === participant.id ? 'rotate-180' : ''}`}
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Détails des formations */}
                            {expandedParticipant === participant.id && (
                                <div className="border-t border-gray-200 bg-gray-50">
                                    <div className="p-6 space-y-4">
                                        {participant.trainings.map((training) => (
                                            <div key={training.id} className="bg-white rounded-lg border border-gray-200">
                                                {/* En-tête formation */}
                                                <div 
                                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                                    onClick={() => toggleTraining(training.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-800">{training.title}</h4>
                                                            <div className="flex items-center space-x-4 mt-1">
                                                                <span className="text-sm text-gray-600 flex items-center">
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                    </svg>
                                                                    {training.theme}
                                                                </span>
                                                                <span className="text-sm text-gray-600 flex items-center">
                                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    {training.location}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                                training.status === 'TERMINE' ? 'bg-green-100 text-green-800' :
                                                                training.status === 'EN_COURS' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {training.status}
                                                            </span>
                                                            <span className="text-sm font-medium text-marsa-blue">
                                                                {training.responses.length} réponse(s)
                                                            </span>
                                                            <svg 
                                                                className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedTraining[training.id] ? 'rotate-180' : ''}`}
                                                                fill="none" 
                                                                stroke="currentColor" 
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Détails des réponses */}
                                                {expandedTraining[training.id] && (
                                                    <div className="border-t border-gray-200 p-4">
                                                        {training.responses.length === 0 ? (
                                                            <p className="text-gray-500 text-center py-4">Aucune réponse pour cette formation</p>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {training.responses.map((response) => (
                                                                    <div key={response.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center space-x-2 mb-2">
                                                                                    <span className="text-sm font-medium text-gray-700">Question #{response.questionId}</span>
                                                                                    <span className="text-xs text-gray-500">
                                                                                        {new Date(response.submittedAt).toLocaleDateString('fr-FR', {
                                                                                            day: 'numeric',
                                                                                            month: 'short',
                                                                                            year: 'numeric',
                                                                                            hour: '2-digit',
                                                                                            minute: '2-digit'
                                                                                        })}
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-gray-800 bg-white p-2 rounded border border-gray-300">
                                                                                    {response.value}
                                                                                </p>
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
                                            <p className="text-gray-500 text-center py-8">Ce participant n'est inscrit à aucune formation</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {participants.length === 0 && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun participant trouvé</h3>
                        <p className="text-gray-500">Il n'y a aucun participant avec des formations dans le système</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantsDetails;
