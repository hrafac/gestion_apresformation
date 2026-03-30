import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen, TrendingUp, Activity, Search, X, BarChart3, UserCheck, Clock, Award, Target } from 'lucide-react';

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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center max-w-md border border-white/20">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès Restreint</h2>
                    <p className="text-gray-600">Cette page est réservée au rôle RH</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-4"></div>
                        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-b-indigo-600 mx-auto mb-4"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Chargement de l'analyse...</p>
                </div>
            </div>
        );
    }

    const overallStats = getOverallStatistics();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 lg:p-6">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-800">Analyse Participants-Formations</h1>
                            </div>
                            <p className="text-gray-600 ml-15">Analyse détaillée de la réaction des participants aux formations</p>
                        </div>
                        
                        {/* Sélecteur de vue */}
                        <div className="flex items-center gap-1 bg-gray-100/50 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('participants')}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    viewMode === 'participants' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                            >
                                <Users className="w-4 h-4 inline mr-2" />
                                Participants
                            </button>
                            <button
                                onClick={() => setViewMode('formations')}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    viewMode === 'formations' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                            >
                                <BookOpen className="w-4 h-4 inline mr-2" />
                                Formations
                            </button>
                            <button
                                onClick={() => setViewMode('detailed')}
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    viewMode === 'detailed' 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                }`}
                            >
                                <Activity className="w-4 h-4 inline mr-2" />
                                Détaillé
                            </button>
                        </div>
                    </div>

                    {/* Statistiques globales */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-5 border border-blue-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-semibold mb-1">Total Participants</p>
                                    <p className="text-3xl font-bold text-blue-800">{overallStats.totalParticipants}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-5 border border-green-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600 font-semibold mb-1">Total Formations</p>
                                    <p className="text-3xl font-bold text-green-800">{overallStats.totalTrainings}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-5 border border-purple-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600 font-semibold mb-1">Participants Actifs</p>
                                    <p className="text-3xl font-bold text-purple-800">{overallStats.activeParticipants}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                    <UserCheck className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl p-5 border border-orange-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-orange-600 font-semibold mb-1">Taux Participation</p>
                                    <p className="text-3xl font-bold text-orange-800">{overallStats.participationRate}%</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recherche */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un participant..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vue Participants */}
                {viewMode === 'participants' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredParticipants.map((participant) => {
                            const totalTrainings = participant.trainings?.length || 0;
                            const totalResponses = participant.trainings?.reduce((sum, t) => sum + (t.responses?.length || 0), 0) || 0;
                            const avgResponseRate = totalTrainings > 0 ? Math.round((totalResponses / (totalTrainings * 10)) * 100) : 0;
                            const engagement = getEngagementLevel(totalResponses, totalTrainings * 10);

                            return (
                                <div key={participant.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ring-4 ring-blue-100">
                                                    <span className="text-white font-bold text-xl">
                                                        {participant.fullName?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">{participant.fullName}</h3>
                                                    <p className="text-sm text-gray-500">{participant.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-3xl group-hover:scale-110 transition-transform">{engagement.icon}</div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-4">
                                            <div className="text-center bg-blue-50/50 rounded-lg p-3">
                                                <p className="text-xl font-bold text-blue-600">{totalTrainings}</p>
                                                <p className="text-xs text-blue-500 font-medium">Formations</p>
                                            </div>
                                            <div className="text-center bg-green-50/50 rounded-lg p-3">
                                                <p className="text-xl font-bold text-green-600">{totalResponses}</p>
                                                <p className="text-xs text-green-500 font-medium">Réponses</p>
                                            </div>
                                            <div className="text-center bg-purple-50/50 rounded-lg p-3">
                                                <p className="text-xl font-bold text-purple-600">{avgResponseRate}%</p>
                                                <p className="text-xs text-purple-500 font-medium">Taux</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-gray-700">Engagement global</span>
                                                <span className="text-sm font-bold text-gray-700">{avgResponseRate}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200/50 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(avgResponseRate)}`}
                                                    style={{ width: `${avgResponseRate}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Award className={`w-4 h-4 ${engagement.color.replace('text-', 'fill-current text-')}`} />
                                                <p className="text-sm text-gray-600">
                                                    <span className={`font-semibold ${engagement.color}`}>{engagement.level}</span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedParticipant(participant);
                                                    setViewMode('detailed');
                                                }}
                                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
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
                                <div key={training.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">{training.title}</h3>
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <BookOpen className="w-4 h-4" />
                                                {training.theme}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(training.status)}`}>
                                                {training.status}
                                            </span>
                                            <div className="text-3xl group-hover:scale-110 transition-transform">{engagement.icon}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        <div className="bg-blue-50/50 rounded-xl p-4 text-center">
                                            <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-blue-700">{participantsInTraining.length}</p>
                                            <p className="text-xs text-blue-600 font-medium">Participants</p>
                                        </div>
                                        <div className="bg-green-50/50 rounded-xl p-4 text-center">
                                            <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-green-700">{responsesInTraining}</p>
                                            <p className="text-xs text-green-600 font-medium">Réponses totales</p>
                                        </div>
                                        <div className="bg-purple-50/50 rounded-xl p-4 text-center">
                                            <BarChart3 className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-purple-700">{avgResponsesPerParticipant}</p>
                                            <p className="text-xs text-purple-600 font-medium">Moyenne/participant</p>
                                        </div>
                                        <div className="bg-orange-50/50 rounded-xl p-4 text-center">
                                            <TrendingUp className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                                            <p className="text-2xl font-bold text-orange-700">{completionRate}%</p>
                                            <p className="text-xs text-orange-600 font-medium">Complétion</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Award className={`w-4 h-4 ${engagement.color.replace('text-', 'fill-current text-')}`} />
                                            <p className="text-sm text-gray-600">
                                                Engagement: <span className={`font-semibold ${engagement.color}`}>{engagement.level}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedTraining(training);
                                                setViewMode('detailed');
                                            }}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
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
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ring-4 ring-blue-100">
                                        <span className="text-white font-bold text-2xl">
                                            {selectedParticipant.fullName?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">{selectedParticipant.fullName}</h2>
                                        <p className="text-sm text-gray-600">{selectedParticipant.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedParticipant(null);
                                        setSelectedTraining(null);
                                        setViewMode('participants');
                                    }}
                                    className="p-3 hover:bg-gray-100/50 rounded-xl transition-all duration-200 hover:scale-105"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedParticipant.trainings?.map((training) => {
                                    const stats = calculateParticipantStatistics(training);
                                    const engagement = getEngagementLevel(stats.totalResponses, 10);

                                    return (
                                        <div 
                                            key={training.id} 
                                            className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 cursor-pointer hover:bg-gray-100/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group"
                                            onClick={() => setSelectedTraining(training)}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{training.title}</h4>
                                                <div className="text-lg group-hover:scale-110 transition-transform">{engagement.icon}</div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Réponses:</span>
                                                    <span className="font-bold text-blue-600">{stats.totalResponses}/10</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Score moyen:</span>
                                                    <span className="font-bold text-green-600">{stats.averageScore}</span>
                                                </div>
                                                <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(stats.responseRate)}`}
                                                        style={{ width: `${stats.responseRate}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex items-center justify-center gap-2">
                                                    <Award className={`w-3 h-3 ${engagement.color.replace('text-', 'fill-current text-')}`} />
                                                    <p className="text-xs text-center text-gray-600 font-medium">
                                                        <span className={engagement.color}>{engagement.level}</span> ({stats.responseRate}%)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedTraining && analysisData && (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">
                                        Analyse détaillée - {selectedTraining.title}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-200/50">
                                        <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-blue-500" />
                                            Statistiques
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                                <span className="text-gray-600">Total réponses:</span>
                                                <span className="font-bold text-blue-600">{analysisData.statistics.totalResponses}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                                <span className="text-gray-600">Taux de réponse:</span>
                                                <span className="font-bold text-green-600">{analysisData.statistics.responseRate}%</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                                <span className="text-gray-600">Score moyen:</span>
                                                <span className="font-bold text-purple-600">{analysisData.statistics.averageScore}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                                                <span className="text-gray-600">Niveau d'engagement:</span>
                                                <span className={`font-bold ${getEngagementLevel(analysisData.statistics.totalResponses, 10).color}`}>
                                                    {getEngagementLevel(analysisData.statistics.totalResponses, 10).level}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-200/50">
                                        <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                            <Target className="w-5 h-5 text-orange-500" />
                                            Distribution des réponses
                                        </h4>
                                        <div className="space-y-3">
                                            {Object.entries(analysisData.statistics.responseDistribution).map(([value, count]) => (
                                                <div key={value} className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                                                    <span className="text-sm text-gray-600 font-medium">{value}:</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-gray-200/50 rounded-full h-2 overflow-hidden">
                                                            <div 
                                                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                                                                style={{ width: `${(count / analysisData.statistics.totalResponses) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-700 w-8 text-right">{count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {analysisData.statistics.lastActivity && (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-5 h-5 text-blue-500" />
                                            <p className="text-sm text-gray-700">
                                                Dernière activité: <span className="font-semibold text-blue-700">
                                                    {new Date(analysisData.statistics.lastActivity.submittedAt).toLocaleString('fr-FR')}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {filteredParticipants.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun participant trouvé</h3>
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
