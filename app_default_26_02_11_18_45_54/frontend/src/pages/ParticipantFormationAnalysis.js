import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ParticipantFormationAnalysis = () => {
    const { user } = useAuth();
    const [participantsData, setParticipantsData] = useState([]);
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('participants'); // participants, formations, detailed

    useEffect(() => {
        if (user?.role !== 'RH') {
            return;
        }

        const fetchParticipantsData = async () => {
            try {
                console.log('Récupération des données participants avec formations et réponses...');
                const response = await api.get('/participants/with-trainings-and-responses');
                console.log('Données complètes des participants:', response.data);
                setParticipantsData(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des données participants:', error);
                setParticipantsData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchParticipantsData();
    }, [user]);

    useEffect(() => {
        if (selectedParticipant && selectedTraining) {
            fetchDetailedAnalysis();
        }
    }, [selectedParticipant, selectedTraining]);

    const fetchDetailedAnalysis = async () => {
        try {
            // Analyser les données déjà disponibles
            const participant = participantsData.find(p => p.id === selectedParticipant.id);
            if (participant) {
                const training = participant.trainings?.find(t => t.id === selectedTraining.id);
                if (training) {
                    const analysis = {
                        participant: participant,
                        training: training,
                        responses: training.responses || [],
                        statistics: calculateParticipantStatistics(training)
                    };
                    setAnalysisData(analysis);
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'analyse détaillée:', error);
        }
    };

    const calculateParticipantStatistics = (training) => {
        const responses = training.responses || [];
        const totalQuestions = 10; // Estimation
        
        return {
            totalResponses: responses.length,
            responseRate: Math.round((responses.length / totalQuestions) * 100),
            averageScore: calculateAverageScore(responses),
            responseDistribution: calculateResponseDistribution(responses),
            engagementLevel: getEngagementLevel(responses.length, totalQuestions),
            lastActivity: getLastActivity(responses)
        };
    };

    const calculateAverageScore = (responses) => {
        if (!responses || responses.length === 0) return 0;
        
        const numericResponses = responses
            .map(r => {
                const value = r.value;
                if (typeof value === 'number') return value;
                if (typeof value === 'string') {
                    const num = parseFloat(value);
                    return isNaN(num) ? 0 : num;
                }
                return 0;
            })
            .filter(v => v > 0);
            
        if (numericResponses.length === 0) return 0;
        return (numericResponses.reduce((sum, val) => sum + val, 0) / numericResponses.length).toFixed(1);
    };

    const calculateResponseDistribution = (responses) => {
        const distribution = {};
        responses.forEach(response => {
            const value = response.value;
            const key = typeof value === 'string' ? value : value.toString();
            distribution[key] = (distribution[key] || 0) + 1;
        });
        return distribution;
    };

    const getEngagementLevel = (responsesCount, totalQuestions) => {
        const rate = (responsesCount / totalQuestions) * 100;
        if (rate >= 80) return { level: 'Très Élevé', color: 'text-green-600', icon: '🔥' };
        if (rate >= 60) return { level: 'Élevé', color: 'text-blue-600', icon: '⚡' };
        if (rate >= 40) return { level: 'Modéré', color: 'text-yellow-600', icon: '📊' };
        return { level: 'Faible', color: 'text-red-600', icon: '⚠️' };
    };

    const getLastActivity = (responses) => {
        if (!responses || responses.length === 0) return null;
        return responses.reduce((latest, response) => {
            return !latest || new Date(response.submittedAt) > new Date(latest.submittedAt) 
                ? response 
                : latest;
        }, null);
    };

    const getOverallStatistics = () => {
        const totalParticipants = participantsData.length;
        const totalTrainings = new Set(participantsData.flatMap(p => p.trainings?.map(t => t.id) || [])).size;
        const totalResponses = participantsData.reduce((sum, p) => 
            sum + (p.trainings?.reduce((trainSum, t) => trainSum + (t.responses?.length || 0), 0) || 0), 0);
        
        const activeParticipants = participantsData.filter(p => 
            p.trainings && p.trainings.some(t => t.responses && t.responses.length > 0)
        ).length;

        return {
            totalParticipants,
            totalTrainings,
            totalResponses,
            activeParticipants,
            participationRate: totalParticipants > 0 ? Math.round((activeParticipants / totalParticipants) * 100) : 0
        };
    };

    const filteredParticipants = participantsData.filter(participant =>
        participant.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        participant.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'TERMINE':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'EN_COURS':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'PAS_ENCORE':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-blue-500';
        if (percentage >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
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
                    <p className="text-gray-600">Chargement de l'analyse...</p>
                </div>
            </div>
        );
    }

    const overallStats = getOverallStatistics();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                                <svg className="w-8 h-8 mr-3 text-marsa-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Analyse Participants-Formations
                            </h1>
                            <p className="text-gray-600 mt-2">Analyse détaillée de la réaction des participants aux formations</p>
                        </div>
                        
                        {/* Sélecteur de vue */}
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('participants')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'participants' 
                                        ? 'bg-white text-marsa-blue shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Participants
                            </button>
                            <button
                                onClick={() => setViewMode('formations')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'formations' 
                                        ? 'bg-white text-marsa-blue shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Formations
                            </button>
                            <button
                                onClick={() => setViewMode('detailed')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'detailed' 
                                        ? 'bg-white text-marsa-blue shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                Détaillé
                            </button>
                        </div>
                    </div>

                    {/* Statistiques globales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Total Participants</p>
                                    <p className="text-2xl font-bold text-blue-800">{overallStats.totalParticipants}</p>
                                </div>
                                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600 font-medium">Total Formations</p>
                                    <p className="text-2xl font-bold text-green-800">{overallStats.totalTrainings}</p>
                                </div>
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600 font-medium">Participants Actifs</p>
                                    <p className="text-2xl font-bold text-purple-800">{overallStats.activeParticipants}</p>
                                </div>
                                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-orange-600 font-medium">Taux Participation</p>
                                    <p className="text-2xl font-bold text-orange-800">{overallStats.participationRate}%</p>
                                </div>
                                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Recherche */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Rechercher un participant..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marsa-blue focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vue Participants */}
                {viewMode === 'participants' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredParticipants.map((participant) => {
                            const totalTrainings = participant.trainings?.length || 0;
                            const totalResponses = participant.trainings?.reduce((sum, t) => sum + (t.responses?.length || 0), 0) || 0;
                            const avgResponseRate = totalTrainings > 0 ? Math.round((totalResponses / (totalTrainings * 10)) * 100) : 0;
                            const engagement = getEngagementLevel(totalResponses, totalTrainings * 10);

                            return (
                                <div key={participant.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold text-lg">
                                                        {participant.fullName?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800">{participant.fullName}</h3>
                                                    <p className="text-sm text-gray-600">{participant.email}</p>
                                                </div>
                                            </div>
                                            <span className="text-2xl">{engagement.icon}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="text-center">
                                                <p className="text-xl font-bold text-blue-600">{totalTrainings}</p>
                                                <p className="text-xs text-gray-600">Formations</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xl font-bold text-green-600">{totalResponses}</p>
                                                <p className="text-xs text-gray-600">Réponses</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xl font-bold text-purple-600">{avgResponseRate}%</p>
                                                <p className="text-xs text-gray-600">Taux</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Engagement global</span>
                                                <span className="text-sm font-medium text-gray-700">{avgResponseRate}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(avgResponseRate)}`}
                                                    style={{ width: `${avgResponseRate}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-600">
                                                Engagement: <span className={engagement.color}>{engagement.level}</span>
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setSelectedParticipant(participant);
                                                    setViewMode('detailed');
                                                }}
                                                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                                            >
                                                Voir détails
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Vue Formations */}
                {viewMode === 'formations' && (
                    <div className="space-y-4">
                        {Array.from(new Set(participantsData.flatMap(p => p.trainings?.map(t => ({
                            id: t.id,
                            title: t.title,
                            theme: t.theme,
                            status: t.status
                        })) || []))).map((training) => {
                            const participantsInTraining = participantsData.filter(p => 
                                p.trainings?.some(t => t.id === training.id)
                            );
                            const responsesInTraining = participantsInTraining.reduce((sum, p) => {
                                const trainingData = p.trainings?.find(t => t.id === training.id);
                                return sum + (trainingData?.responses?.length || 0);
                            }, 0);
                            
                            const avgResponsesPerParticipant = participantsInTraining.length > 0 
                                ? (responsesInTraining / participantsInTraining.length).toFixed(1) 
                                : 0;
                            const completionRate = participantsInTraining.length > 0 
                                ? Math.round((avgResponsesPerParticipant / 10) * 100) 
                                : 0;
                            const engagement = getEngagementLevel(responsesInTraining, participantsInTraining.length * 10);

                            return (
                                <div key={training.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">{training.title}</h3>
                                            <p className="text-sm text-gray-600">{training.theme}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(training.status)}`}>
                                                {training.status}
                                            </span>
                                            <span className="text-2xl">{engagement.icon}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-blue-600">{participantsInTraining.length}</p>
                                            <p className="text-xs text-gray-600">Participants</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-green-600">{responsesInTraining}</p>
                                            <p className="text-xs text-gray-600">Réponses totales</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-purple-600">{avgResponsesPerParticipant}</p>
                                            <p className="text-xs text-gray-600">Moyenne/participant</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-orange-600">{completionRate}%</p>
                                            <p className="text-xs text-gray-600">Complétion</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600">
                                            Engagement: <span className={engagement.color}>{engagement.level}</span>
                                        </p>
                                        <button
                                            onClick={() => {
                                                setSelectedTraining(training);
                                                setViewMode('detailed');
                                            }}
                                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                                        >
                                            Voir participants
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Vue Détaillée */}
                {viewMode === 'detailed' && selectedParticipant && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">
                                            {selectedParticipant.fullName?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">{selectedParticipant.fullName}</h2>
                                        <p className="text-sm text-gray-600">{selectedParticipant.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedParticipant(null);
                                        setSelectedTraining(null);
                                        setViewMode('participants');
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedParticipant.trainings?.map((training) => {
                                    const stats = calculateParticipantStatistics(training);
                                    const engagement = getEngagementLevel(stats.totalResponses, 10);

                                    return (
                                        <div 
                                            key={training.id} 
                                            className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => setSelectedTraining(training)}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium text-gray-800">{training.title}</h4>
                                                <span className="text-lg">{engagement.icon}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Réponses:</span>
                                                    <span className="font-medium">{stats.totalResponses}/10</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-600">Score moyen:</span>
                                                    <span className="font-medium">{stats.averageScore}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(stats.responseRate)}`}
                                                        style={{ width: `${stats.responseRate}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-xs text-center text-gray-600">
                                                    {engagement.level} ({stats.responseRate}%)
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedTraining && analysisData && (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">
                                    Analyse détaillée - {selectedTraining.title}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-3">Statistiques</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total réponses:</span>
                                                <span className="font-medium">{analysisData.statistics.totalResponses}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Taux de réponse:</span>
                                                <span className="font-medium">{analysisData.statistics.responseRate}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Score moyen:</span>
                                                <span className="font-medium">{analysisData.statistics.averageScore}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Niveau d'engagement:</span>
                                                <span className={`font-medium ${getEngagementLevel(analysisData.statistics.totalResponses, 10).color}`}>
                                                    {getEngagementLevel(analysisData.statistics.totalResponses, 10).level}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-3">Distribution des réponses</h4>
                                        <div className="space-y-2">
                                            {Object.entries(analysisData.statistics.responseDistribution).map(([value, count]) => (
                                                <div key={value} className="flex items-center justify-between">
                                                    <span className="text-gray-600">{value}:</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-20 bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-blue-500 h-2 rounded-full"
                                                                style={{ width: `${(count / analysisData.statistics.totalResponses) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium">{count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {analysisData.statistics.lastActivity && (
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            Dernière activité: <span className="font-medium">
                                                {new Date(analysisData.statistics.lastActivity.submittedAt).toLocaleString('fr-FR')}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {filteredParticipants.length === 0 && (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun participant trouvé</h3>
                        <p className="text-gray-500">
                            {searchTerm ? 'Essayez de modifier votre recherche' : 'Aucun participant disponible'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticipantFormationAnalysis;
