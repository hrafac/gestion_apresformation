import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import '../styles/formation.css';

const Formation = () => {
    const [trainings, setTrainings] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showParticipantModal, setShowParticipantModal] = useState(false);
    const [showViewParticipantsModal, setShowViewParticipantsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        theme: '',
        location: '',
        startDate: '',
        endDate: '',
        trainer: { id: 1 },
        participants: []
    });

    useEffect(() => {
        fetchTrainings();
        fetchTrainers();
        fetchParticipants();
    }, []);

    const fetchTrainings = async () => {
        try {
            const response = await api.get('/rh/trainings');
            setTrainings(response.data);
        } catch (error) {
            console.error('Error fetching trainings:', error);
        }
    };

    const fetchTrainers = async () => {
        try {
            const response = await api.get('/auth/users/formateurs');
            setTrainers(response.data);
        } catch (error) {
            console.error('Error fetching trainers:', error);
        }
    };

    const fetchParticipants = async () => {
        try {
            const response = await api.get('/auth/users/participants');
            setParticipants(response.data);
        } catch (error) {
            console.error('Error fetching participants:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/rh/trainings', formData);
            setShowModal(false);
            setFormData({
                title: '',
                theme: '',
                location: '',
                startDate: '',
                endDate: '',
                trainer: { id: 1 },
                participants: []
            });
            fetchTrainings();
        } catch (error) {
            console.error('Error creating training:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'trainer') {
            setFormData(prev => ({
                ...prev,
                trainer: { id: parseInt(value) }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleAddParticipant = (training) => {
        setSelectedTraining(training);
        setSelectedParticipants([]);
        setShowParticipantModal(true);
    };

    const handleViewParticipants = (training) => {
        setSelectedTraining(training);
        setShowViewParticipantsModal(true);
    };

    const handleParticipantSubmit = async (e) => {
        e.preventDefault();
        
        try {
            await api.post(`/training/${selectedTraining.id}/participants`, selectedParticipants);
            setShowParticipantModal(false);
            setSelectedTraining(null);
            setSelectedParticipants([]);
            fetchTrainings();
        } catch (error) {
            console.error('Error adding participants:', error);
        }
    };

    const handleParticipantChange = (participantId) => {
        setSelectedParticipants(prev => {
            if (prev.includes(participantId)) {
                return prev.filter(id => id !== participantId);
            } else {
                return [...prev, participantId];
            }
        });
    };

    const handleDeleteTraining = (training) => {
        setSelectedTraining(training);
        setShowDeleteModal(true);
    };

    const handleEditTraining = (training) => {
        setSelectedTraining(training);
        
        // Gestion robuste des dates
        const formatDateTimeLocal = (dateString) => {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().slice(0, 16);
            } catch (error) {
                return '';
            }
        };
        
        setFormData({
            title: training.title || '',
            theme: training.theme || '',
            location: training.location || '',
            startDate: formatDateTimeLocal(training.startDate),
            endDate: formatDateTimeLocal(training.endDate),
            trainer: training.trainer ? { id: training.trainer.id } : { id: 1 },
            participants: training.participants || []
        });
        setShowEditModal(true);
    };

    const handleUpdateTraining = async (e) => {
        e.preventDefault();
        try {
            console.log('Updating training ID:', selectedTraining.id);
            console.log('Update data:', formData);
            
            await api.put(`/training/${selectedTraining.id}`, formData);
            
            setShowEditModal(false);
            setSelectedTraining(null);
            setFormData({
                title: '',
                theme: '',
                location: '',
                startDate: '',
                endDate: '',
                trainer: { id: 1 },
                participants: []
            });
            fetchTrainings();
        } catch (error) {
            console.error('Error updating training:', error);
            console.error('Error response:', error.response);
            
            if (error.response?.status === 403) {
                alert('Erreur 403: Vous n\'avez pas les permissions pour modifier cette formation.');
            } else if (error.response?.status === 401) {
                alert('Erreur 401: Votre session a expiré. Veuillez vous reconnecter.');
            } else if (error.response?.status === 404) {
                alert('Erreur 404: Formation non trouvée.');
            } else {
                alert(`Erreur lors de la modification: ${error.response?.data?.error || error.message}`);
            }
        }
    };

    const handleConfirmDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Token:', token); // Debug token
            console.log('Deleting training ID:', selectedTraining.id); // Debug ID
            
            await api.delete(`/training/${selectedTraining.id}`);
            
            setShowDeleteModal(false);
            setSelectedTraining(null);
            fetchTrainings();
        } catch (error) {
            console.error('Error deleting training:', error);
            console.error('Error response:', error.response); // Debug response
            
            if (error.response?.status === 403) {
                alert('Erreur 403: Vous n\'avez pas les permissions pour supprimer une formation. Vérifiez que vous êtes bien connecté avec un compte autorisé.');
            } else if (error.response?.status === 401) {
                alert('Erreur 401: Votre session a expiré. Veuillez vous reconnecter.');
            } else if (error.response?.status === 404) {
                alert('Erreur 404: Formation non trouvée.');
            } else {
                alert(`Erreur lors de la suppression: ${error.response?.data?.error || error.message}`);
            }
        }
    };

    const handleRemoveParticipant = async (trainingId, participantId) => {
        try {
            const token = localStorage.getItem('token');
            console.log('Token:', token);
            console.log('Removing participant:', participantId, 'from training:', trainingId);
            
            await api.delete(`/training/${trainingId}/participants/${participantId}`);
            
            // Rafraîchir les données
            fetchTrainings();
            // Mettre à jour la formation sélectionnée si la modal est ouverte
            if (selectedTraining && selectedTraining.id === trainingId) {
                setSelectedTraining(prev => ({
                    ...prev,
                    participants: prev.participants.filter(p => p.id !== participantId)
                }));
            }
        } catch (error) {
            console.error('Error removing participant:', error);
            console.error('Error response:', error.response);
            
            if (error.response?.status === 403) {
                alert('Erreur 403: Vous n\'avez pas les permissions pour supprimer ce participant.');
            } else if (error.response?.status === 401) {
                alert('Erreur 401: Votre session a expiré. Veuillez vous reconnecter.');
            } else if (error.response?.status === 404) {
                alert('Erreur 404: Participant ou formation non trouvé.');
            } else {
                alert(`Erreur lors de la suppression du participant: ${error.response?.data?.error || error.message}`);
            }
        }
    };

    return (
        <div className="min-h-screen bg-white p-6 relative overflow-hidden">
            {/* Background Blue Accents */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header Section with Stats */}
                <div className="mb-12">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full blur-lg opacity-75 animate-pulse"></div>
                                    <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full border border-blue-400">
                                        SYSTEM ACTIVE
                                    </div>
                                </div>
                            </div>
                            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent leading-tight">
                                Gestion des Formations
                            </h1>
                            <p className="text-gray-600 text-lg">Plateforme de gestion des programmes de développement</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="group relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-2 transition-all duration-500 flex items-center overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                            <svg className="w-5 h-5 mr-3 relative z-10 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="relative z-10">Nouvelle Formation</span>
                        </button>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <span className="text-2xl font-bold text-gray-800">{trainings.length}</span>
                                </div>
                                <h3 className="text-gray-800 font-semibold mb-1">Formations Actives</h3>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-2xl font-bold text-gray-800">{participants.length}</span>
                                </div>
                                <h3 className="text-gray-800 font-semibold mb-1">Participants</h3>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <span className="text-2xl font-bold text-gray-800">{trainers.length}</span>
                                </div>
                                <h3 className="text-gray-800 font-semibold mb-1">Formateurs</h3>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formation Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {trainings.map((training, index) => (
                        <div 
                            key={training.id} 
                            className="group relative bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden transition-all duration-700 hover:-translate-y-3 hover:shadow-blue-500/20 hover:border-blue-300 animate-fade-in-up cursor-pointer"
                            style={{ animationDelay: `${index * 100}ms` }}
                            onClick={() => handleViewParticipants(training)}
                        >
                            {/* Glow Effect on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
                            
                            {/* Geometric Pattern Background */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute top-0 left-0 w-full h-full bg-geometric-pattern"></div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 z-20">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-200 rounded-full blur-lg animate-pulse"></div>
                                    <span className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full border border-blue-400">
                                        ACTIVE
                                    </span>
                                </div>
                            </div>
                            
                            {/* Card Header */}
                            <div className="relative h-40 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-6 overflow-hidden">
                                <div className="absolute inset-0 bg-black opacity-10"></div>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
                                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                                <h3 className="relative text-xl font-black text-white leading-tight z-10">
                                    {training.title}
                                </h3>
                            </div>
                            
                            {/* Card Body */}
                            <div className="relative p-6 z-10">
                                <div className="space-y-4">
                                    {/* Theme */}
                                    <div className="flex items-start">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-blue-200 rounded-xl blur-lg opacity-50"></div>
                                            <div className="relative bg-gradient-to-br from-blue-400 to-blue-500 p-3 rounded-xl">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Thème</p>
                                            <p className="text-sm text-gray-800 font-medium">{training.theme}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Location */}
                                    <div className="flex items-start">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-blue-200 rounded-xl blur-lg opacity-50"></div>
                                            <div className="relative bg-gradient-to-br from-blue-400 to-blue-500 p-3 rounded-xl">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Lieu</p>
                                            <p className="text-sm text-gray-800 font-medium">{training.location}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Trainer Info */}
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border border-blue-300">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Formateur</p>
                                            <p className="text-sm text-gray-800 font-medium">
                                                {trainers.find(t => t.id === training.trainer?.id)?.fullName || 'Non assigné'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="mt-6 space-y-3">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddParticipant(training);
                                        }}
                                        className="w-full group relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white px-4 py-3 rounded-2xl font-bold hover:shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-500 flex items-center justify-center overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                                        <svg className="w-4 h-4 mr-2 relative z-10 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="relative z-10">Gérer les participants</span>
                                    </button>
                                    
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditTraining(training);
                                            }}
                                            className="flex-1 group relative bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white px-4 py-3 rounded-2xl font-bold hover:shadow-2xl hover:shadow-emerald-500/25 transform hover:-translate-y-1 transition-all duration-500 flex items-center justify-center overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                                            <svg className="w-4 h-4 mr-2 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            <span className="relative z-10">Modifier</span>
                                        </button>
                                        
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteTraining(training);
                                            }}
                                            className="flex-1 group relative bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-4 py-3 rounded-2xl font-bold hover:shadow-2xl hover:shadow-red-500/25 transform hover:-translate-y-1 transition-all duration-500 flex items-center justify-center overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                                            <svg className="w-4 h-4 mr-2 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span className="relative z-10">Supprimer</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {trainings.length === 0 && (
                    <div className="text-center py-32">
                        <div className="relative inline-block mb-8">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200 rounded-full blur-3xl opacity-40 scale-150 animate-pulse"></div>
                            <div className="relative bg-white border border-gray-200 rounded-full p-12 shadow-lg">
                                <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-gray-800 mb-4">Aucune formation trouvée</h3>
                        <p className="text-gray-600 text-lg mb-12 max-w-md mx-auto">
                            Lancez votre première formation et commencez à développer les compétences de vos équipes
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="group relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white px-10 py-4 rounded-2xl font-bold shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-2 transition-all duration-500 inline-flex items-center"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                            <svg className="w-5 h-5 mr-3 relative z-10 group-hover:rotate-90 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="relative z-10">Créer votre première formation</span>
                        </button>
                    </div>
                )}

                {/* Edit Formation Modal */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full transform transition-all duration-500 scale-100 border border-gray-200 animate-scale-in">
                            {/* Modal Header */}
                            <div className="relative bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-8 py-6 rounded-t-3xl border-b border-gray-200">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
                                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                                <h2 className="relative text-2xl font-black text-white">Modifier la Formation</h2>
                                <p className="relative text-emerald-100 text-sm mt-1">Mettez à jour les informations de la formation</p>
                            </div>
                            
                            {/* Modal Body */}
                            <div className="p-8">
                                <form onSubmit={handleUpdateTraining} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            Titre de la formation
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Formation Java Avancé"
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                            </div>
                                            Thème
                                        </label>
                                        <input
                                            type="text"
                                            name="theme"
                                            value={formData.theme}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Développement Backend"
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            Lieu
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Salle B"
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                Date de début
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                Date de fin
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            Formateur
                                        </label>
                                        <select
                                            name="trainer"
                                            value={formData.trainer.id}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                                        >
                                            <option value="" className="bg-white">Sélectionner un formateur</option>
                                            {trainers.map(trainer => (
                                                <option key={trainer.id} value={trainer.id} className="bg-white">
                                                    {trainer.fullName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="flex space-x-4 pt-8">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-emerald-500/25 transform hover:-translate-y-1 transition-all duration-500"
                                        >
                                            Mettre à jour la formation
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEditModal(false);
                                                setSelectedTraining(null);
                                                setFormData({
                                                    title: '',
                                                    theme: '',
                                                    location: '',
                                                    startDate: '',
                                                    endDate: '',
                                                    trainer: { id: 1 },
                                                    participants: []
                                                });
                                            }}
                                            className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && selectedTraining && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-500 scale-100 border border-gray-200 animate-scale-in">
                            {/* Modal Header */}
                            <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-8 py-6 rounded-t-3xl border-b border-gray-200">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
                                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                                <h2 className="relative text-2xl font-black text-white">Supprimer la Formation</h2>
                                <p className="relative text-red-100 text-sm mt-1">Cette action est irréversible</p>
                            </div>
                            
                            {/* Modal Body */}
                            <div className="p-8">
                                <div className="text-center mb-8">
                                    <div className="relative inline-block mb-6">
                                        <div className="absolute inset-0 bg-red-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                                        <div className="relative w-20 h-20 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-200">
                                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-gray-800 mb-3">
                                        Êtes-vous sûr de vouloir supprimer cette formation ?
                                    </h3>
                                    
                                    <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
                                        <p className="text-sm font-semibold text-gray-600 mb-2">Formation à supprimer :</p>
                                        <p className="text-lg font-bold text-gray-800">{selectedTraining.title}</p>
                                        <p className="text-sm text-gray-500 mt-1">{selectedTraining.theme}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(selectedTraining.startDate).toLocaleDateString('fr-FR', { 
                                                day: 'numeric', 
                                                month: 'short', 
                                                year: 'numeric' 
                                            })} - {new Date(selectedTraining.endDate).toLocaleDateString('fr-FR', { 
                                                day: 'numeric', 
                                                month: 'short', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                        <div className="flex items-start">
                                            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-red-800 mb-1">Attention :</p>
                                                <p className="text-sm text-red-700">
                                                    Cette action supprimera définitivement la formation et toutes les données associées. 
                                                    Cette action ne peut pas être annulée.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex space-x-4">
                                    <button
                                        onClick={handleConfirmDelete}
                                        className="flex-1 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-red-500/25 transform hover:-translate-y-1 transition-all duration-500 flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Oui, supprimer
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setSelectedTraining(null);
                                        }}
                                        className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Formation Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full transform transition-all duration-500 scale-100 border border-gray-200 animate-scale-in">
                            {/* Modal Header */}
                            <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-8 py-6 rounded-t-3xl border-b border-gray-200">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
                                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                                <h2 className="relative text-2xl font-black text-white">Nouvelle Formation</h2>
                                <p className="relative text-blue-100 text-sm mt-1">Configurez votre nouvelle formation</p>
                            </div>
                            
                            {/* Modal Body */}
                            <div className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            Titre de la formation
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Leadership et Management"
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                            </div>
                                            Thème
                                        </label>
                                        <input
                                            type="text"
                                            name="theme"
                                            value={formData.theme}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Développement personnel"
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            Lieu
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            required
                                            placeholder="Ex: Salle de conférence A"
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                Date de début
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                Date de fin
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            Formateur
                                        </label>
                                        <select
                                            name="trainer"
                                            value={formData.trainer.id}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-2xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300"
                                        >
                                            <option value="" className="bg-white">Sélectionner un formateur</option>
                                            {trainers.map(trainer => (
                                                <option key={trainer.id} value={trainer.id} className="bg-white">
                                                    {trainer.fullName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="flex space-x-4 pt-8">
                                        <button
                                            type="submit"
                                            className="flex-1 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-500"
                                        >
                                            Créer la formation
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Participants Modal */}
                {showParticipantModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full transform transition-all duration-500 scale-100 border border-gray-200 animate-scale-in">
                            {/* Modal Header */}
                            <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-8 py-6 rounded-t-3xl border-b border-gray-200">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
                                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                                <h2 className="relative text-2xl font-black text-white">Gérer les Participants</h2>
                                <p className="relative text-blue-100 text-sm mt-1">
                                    Formation: {selectedTraining?.title}
                                </p>
                            </div>
                            
                            {/* Modal Body */}
                            <div className="p-8">
                                <form onSubmit={handleParticipantSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-4 flex items-center">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            </div>
                                            Sélectionner les participants
                                        </label>
                                        <div className="max-h-96 overflow-y-auto custom-scrollbar border border-gray-200 rounded-2xl p-4 space-y-2 bg-gray-50">
                                            {participants.map((participant, index) => (
                                                <div 
                                                    key={participant.id} 
                                                    className="group flex items-center p-4 rounded-2xl hover:bg-gray-100 transition-all duration-300 animate-fade-in-up"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            id={`participant-${participant.id}`}
                                                            value={participant.id}
                                                            checked={selectedParticipants.includes(participant.id)}
                                                            onChange={() => handleParticipantChange(participant.id)}
                                                            className="w-6 h-6 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2 bg-gray-50 cursor-pointer"
                                                        />
                                                        {selectedParticipants.includes(participant.id) && (
                                                            <div className="absolute -inset-1 bg-blue-200 rounded-lg blur-lg opacity-50 animate-pulse"></div>
                                                        )}
                                                    </div>
                                                    <label 
                                                        htmlFor={`participant-${participant.id}`}
                                                        className="ml-4 flex-1 cursor-pointer flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center">
                                                            <div className="relative">
                                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full blur-lg opacity-50"></div>
                                                                <div className="relative w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
                                                                    <span className="text-gray-800 font-bold text-sm">
                                                                        {participant.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <p className="text-sm font-bold text-gray-800">{participant.fullName}</p>
                                                                <p className="text-xs text-gray-500">Participant</p>
                                                            </div>
                                                        </div>
                                                        {selectedParticipants.includes(participant.id) && (
                                                            <div className="flex items-center space-x-2">
                                                                <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full border border-blue-400 flex items-center">
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    Sélectionné
                                                                </div>
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                            ))}
                                            {participants.length === 0 && (
                                                <div className="text-center py-16">
                                                    <div className="relative inline-block mb-4">
                                                        <div className="absolute inset-0 bg-gray-300 rounded-full blur-lg opacity-30"></div>
                                                        <div className="relative w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
                                                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-600 font-bold text-lg">Aucun participant disponible</p>
                                                    <p className="text-gray-500 text-sm mt-2">Ajoutez d'abord des participants au système</p>
                                                </div>
                                            )}
                                        </div>
                                        {selectedParticipants.length > 0 && (
                                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4">
                                                <div className="flex items-center">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-blue-200 rounded-lg blur-lg opacity-50 animate-pulse"></div>
                                                        <svg className="relative w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <p className="ml-3 text-blue-700 font-bold">
                                                        {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''} sélectionné{selectedParticipants.length > 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex space-x-4 pt-8">
                                        <button
                                            type="submit"
                                            disabled={selectedParticipants.length === 0}
                                            className="flex-1 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Ajouter ({selectedParticipants.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowParticipantModal(false);
                                                setSelectedTraining(null);
                                                setSelectedParticipants([]);
                                            }}
                                            className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* View Participants Modal */}
                {showViewParticipantsModal && selectedTraining && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full transform transition-all duration-500 scale-100 border border-gray-200 animate-scale-in">
                            {/* Modal Header */}
                            <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 px-8 py-6 rounded-t-3xl border-b border-gray-200">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-16 -mb-16"></div>
                                <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                                <h2 className="relative text-2xl font-black text-white">Participants de la Formation</h2>
                                <p className="relative text-blue-100 text-sm mt-1">
                                    {selectedTraining.title}
                                </p>
                            </div>
                            
                            {/* Modal Body */}
                            <div className="p-8">
                                <div className="mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Thème</p>
                                            <p className="text-sm text-gray-800 font-medium">{selectedTraining.theme}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Lieu</p>
                                            <p className="text-sm text-gray-800 font-medium">{selectedTraining.location}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Date de début</p>
                                            <p className="text-sm text-gray-800 font-medium">
                                                {new Date(selectedTraining.startDateTime).toLocaleDateString('fr-FR', { 
                                                    day: 'numeric', 
                                                    month: 'short', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-2xl p-4">
                                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Date de fin</p>
                                            <p className="text-sm text-gray-800 font-medium">
                                                {new Date(selectedTraining.endDateTime).toLocaleDateString('fr-FR', { 
                                                    day: 'numeric', 
                                                    month: 'short', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        Liste des Participants ({selectedTraining.participants?.length || 0})
                                    </h3>
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar border border-gray-200 rounded-2xl p-4 space-y-2 bg-gray-50">
                                        {selectedTraining.participants && selectedTraining.participants.length > 0 ? (
                                            selectedTraining.participants.map((participant, index) => (
                                                <div 
                                                    key={participant.id} 
                                                    className="flex items-center p-4 rounded-2xl bg-white border border-gray-200 transition-all duration-300 animate-fade-in-up"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full blur-lg opacity-50"></div>
                                                        <div className="relative w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
                                                            <span className="text-gray-800 font-bold text-sm">
                                                                {participant.username ? participant.username.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4 flex-1">
                                                        <p className="text-sm font-bold text-gray-800">{participant.username}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{participant.role.toLowerCase()}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                                                            Participant
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${participant.username} de cette formation ?`)) {
                                                                    handleRemoveParticipant(selectedTraining.id, participant.id);
                                                                }
                                                            }}
                                                            className="group relative bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white p-2 rounded-xl hover:shadow-2xl hover:shadow-red-500/25 transform hover:-translate-y-1 transition-all duration-500"
                                                            title="Supprimer le participant"
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                                                            <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-16">
                                                <div className="relative inline-block mb-4">
                                                    <div className="absolute inset-0 bg-gray-300 rounded-full blur-lg opacity-30"></div>
                                                    <div className="relative w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center border border-gray-300">
                                                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 font-bold text-lg">Aucun participant</p>
                                                <p className="text-gray-500 text-sm mt-2">Cette formation n'a pas encore de participants</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex space-x-4 pt-8">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowViewParticipantsModal(false);
                                            setSelectedTraining(null);
                                        }}
                                        className="w-full bg-gray-100 text-gray-800 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all duration-300 border border-gray-300"
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Formation;
