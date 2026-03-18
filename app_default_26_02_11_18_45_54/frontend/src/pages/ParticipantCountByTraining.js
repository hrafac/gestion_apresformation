import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ParticipantCountByTraining = () => {
    const { user } = useAuth();
    const [trainingCounts, setTrainingCounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('participantCount');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        if (user?.role !== 'RH') {
            return;
        }

        const fetchTrainingCounts = async () => {
            try {
                const response = await api.get('/participants/count-by-training');
                setTrainingCounts(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des statistiques:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrainingCounts();
    }, [user]);

    // Filtrage et tri
    const filteredAndSortedData = trainingCounts
        .filter(training => 
            training.trainingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            training.trainingTheme.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (sortBy === 'participantCount') {
                aValue = parseInt(aValue);
                bValue = parseInt(bValue);
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

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

    const getParticipantCountColor = (count) => {
        if (count === 0) return 'text-red-600 bg-red-50';
        if (count <= 5) return 'text-yellow-600 bg-yellow-50';
        if (count <= 10) return 'text-blue-600 bg-blue-50';
        return 'text-green-600 bg-green-50';
    };

    const totalParticipants = trainingCounts.reduce((sum, training) => sum + training.participantCount, 0);
    const totalTrainings = trainingCounts.length;
    const trainingsWithParticipants = trainingCounts.filter(t => t.participantCount > 0).length;
    const averageParticipants = totalTrainings > 0 ? (totalParticipants / totalTrainings).toFixed(1) : 0;

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
                    <p className="text-gray-600">Chargement des statistiques...</p>
                </div>
            </div>
        );
    }

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
                                Statistiques Participants par Formation
                            </h1>
                            <p className="text-gray-600 mt-2">Vue d'ensemble du nombre de participants par formation</p>
                        </div>
                    </div>

                    {/* Cartes de statistiques */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Total Formations</p>
                                    <p className="text-2xl font-bold text-blue-800">{totalTrainings}</p>
                                </div>
                                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-600 font-medium">Total Participants</p>
                                    <p className="text-2xl font-bold text-green-800">{totalParticipants}</p>
                                </div>
                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600 font-medium">Formations Actives</p>
                                    <p className="text-2xl font-bold text-purple-800">{trainingsWithParticipants}</p>
                                </div>
                                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-orange-600 font-medium">Moyenne/Formation</p>
                                    <p className="text-2xl font-bold text-orange-800">{averageParticipants}</p>
                                </div>
                                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Filtres et recherche */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Rechercher par titre ou thème..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marsa-blue focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tableau des formations */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={() => handleSort('trainingTitle')}
                                            className="flex items-center text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-marsa-blue"
                                        >
                                            Formation
                                            {sortBy === 'trainingTitle' && (
                                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                        d={sortOrder === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                                                </svg>
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={() => handleSort('trainingTheme')}
                                            className="flex items-center text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-marsa-blue"
                                        >
                                            Thème
                                            {sortBy === 'trainingTheme' && (
                                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                        d={sortOrder === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                                                </svg>
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-left">
                                        <button
                                            onClick={() => handleSort('trainingStatus')}
                                            className="flex items-center text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-marsa-blue"
                                        >
                                            Statut
                                            {sortBy === 'trainingStatus' && (
                                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                        d={sortOrder === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                                                </svg>
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleSort('participantCount')}
                                            className="flex items-center justify-end text-xs font-medium text-gray-700 uppercase tracking-wider hover:text-marsa-blue"
                                        >
                                            Participants
                                            {sortBy === 'participantCount' && (
                                                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                                        d={sortOrder === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                                                </svg>
                                            )}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAndSortedData.map((training) => (
                                    <tr key={training.trainingId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{training.trainingTitle}</p>
                                                <p className="text-xs text-gray-500">ID: {training.trainingId}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {training.trainingTheme}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(training.trainingStatus)}`}>
                                                {training.trainingStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end">
                                                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold ${getParticipantCountColor(training.participantCount)}`}>
                                                    {training.participantCount}
                                                </span>
                                                {training.participantCount === 0 && (
                                                    <svg className="ml-2 w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredAndSortedData.length === 0 && (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation trouvée</h3>
                            <p className="text-gray-500">
                                {searchTerm ? 'Essayez de modifier votre recherche' : 'Aucune formation disponible'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParticipantCountByTraining;
