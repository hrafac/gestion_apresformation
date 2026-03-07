import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Tag, Users, Clock, BookOpen, CheckCircle, AlertCircle, User, ChevronDown, ChevronUp, Eye, UserCheck } from 'lucide-react';

const FormateurFormations = () => {
    const [formations, setFormations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedFormation, setExpandedFormation] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchFormations = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/training/formateur/${user.id}`);
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'PLANIFIEE':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'EN_COURS':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'TERMINEE':
                return 'bg-slate-100 text-slate-800 border-slate-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'PLANIFIEE':
                return 'Planifiée';
            case 'EN_COURS':
                return 'En cours';
            case 'TERMINEE':
                return 'Terminée';
            default:
                return status;
        }
    };

    const toggleFormationDetails = (formationId) => {
        setExpandedFormation(expandedFormation === formationId ? null : formationId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement de vos formations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
                    <div className="flex items-center mb-4">
                        <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">Erreur</h3>
                    </div>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-blue-100 rounded-lg p-3 mr-4">
                                <BookOpen className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Mes Formations</h1>
                                <p className="text-gray-600 mt-1">
                                    Gérez les formations que vous animez
                                </p>
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg px-4 py-2">
                            <p className="text-sm text-blue-600 font-medium">
                                {formations.length} formation{formations.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Formations List */}
                <div className="space-y-6">
                    {formations.map((formation) => (
                        <div key={formation.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Formation Header */}
                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <h3 className="text-xl font-semibold text-gray-900 mr-3">
                                                {formation.title}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(formation.status)}`}>
                                                {getStatusText(formation.status)}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-2 text-gray-600">
                                            <div className="flex items-center">
                                                <Tag className="h-4 w-4 mr-2 text-gray-400" />
                                                <span className="text-sm">{formation.theme}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                                <span className="text-sm">{formation.location}</span>
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                <span className="text-sm">
                                                    Du {formatDate(formation.startDateTime)} au {formatDate(formation.endDateTime)}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <Users className="h-4 w-4 mr-2 text-gray-400" />
                                                <span className="text-sm">
                                                    {formation.participants.length} participant{formation.participants.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => toggleFormationDetails(formation.id)}
                                        className="ml-4 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        {expandedFormation === formation.id ? (
                                            <ChevronUp className="h-5 w-5 text-blue-600" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-blue-600" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedFormation === formation.id && (
                                <div className="border-t border-gray-200 bg-gray-50 p-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Formateur Info */}
                                        <div className="bg-white rounded-lg p-4">
                                            <div className="flex items-center mb-3">
                                                <User className="h-5 w-5 text-blue-600 mr-2" />
                                                <h4 className="font-semibold text-gray-900">Informations du formateur</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">ID:</span>
                                                    <span className="font-medium">{formation.trainer.id}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Nom:</span>
                                                    <span className="font-medium">{formation.trainer.username}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Rôle:</span>
                                                    <span className="font-medium">{formation.trainer.role}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Participants List */}
                                        <div className="bg-white rounded-lg p-4">
                                            <div className="flex items-center mb-3">
                                                <UserCheck className="h-5 w-5 text-green-600 mr-2" />
                                                <h4 className="font-semibold text-gray-900">Participants ({formation.participants.length})</h4>
                                            </div>
                                            {formation.participants.length > 0 ? (
                                                <div className="space-y-2">
                                                    {formation.participants.map((participant) => (
                                                        <div key={participant.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                                            <div className="flex items-center">
                                                                <div className="bg-green-100 rounded-full p-1 mr-2">
                                                                    <User className="h-3 w-3 text-green-600" />
                                                                </div>
                                                                <span className="font-medium text-gray-900">{participant.username}</span>
                                                            </div>
                                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                                {participant.role}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-gray-500 text-sm">Aucun participant inscrit</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-4 flex gap-3">
                                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center">
                                            <Eye className="h-4 w-4 mr-2" />
                                            Voir les détails
                                        </button>
                                        <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                                            Gérer la formation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {formations.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune formation</h3>
                        <p className="text-gray-600">Vous n'avez aucune formation assignée pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormateurFormations;
