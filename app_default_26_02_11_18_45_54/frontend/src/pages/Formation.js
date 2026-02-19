import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const Formation = () => {
    const [trainings, setTrainings] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showParticipantModal, setShowParticipantModal] = useState(false);
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Gestion des Formations</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-gradient-to-r from-marsa-blue to-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Ajouter une formation
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trainings.map(training => (
                        <div key={training.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                            <div className="bg-gradient-to-r from-marsa-orange to-orange-500 px-6 py-4">
                                <h3 className="text-lg font-bold text-white">{training.title}</h3>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-2 text-marsa-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        {training.theme}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-2 text-marsa-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {training.location}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-2 text-marsa-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(training.startDate).toLocaleDateString('fr-FR')} - {new Date(training.endDate).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <button 
                                        onClick={() => handleAddParticipant(training)}
                                        className="w-full bg-gradient-to-r from-marsa-blue to-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-shadow duration-200 flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Ajouter participant
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {trainings.length === 0 && (
                    <div className="text-center py-20">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-lg font-medium text-gray-500">Aucune formation trouvée</p>
                        <p className="text-sm text-gray-400 mt-2">Cliquez sur "Ajouter une formation" pour commencer</p>
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">Ajouter une formation</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marsa-blue"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thème</label>
                                    <input
                                        type="text"
                                        name="theme"
                                        value={formData.theme}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marsa-blue"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                                    <input
                                        type="text"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marsa-blue"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                                    <input
                                        type="datetime-local"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marsa-blue"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                                    <input
                                        type="datetime-local"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marsa-blue"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Formateur</label>
                                    <select
                                        name="trainer"
                                        value={formData.trainer.id}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-marsa-blue"
                                    >
                                        <option value="">Sélectionner un formateur</option>
                                        {trainers.map(trainer => (
                                            <option key={trainer.id} value={trainer.id}>
                                                {trainer.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-marsa-blue to-blue-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-shadow duration-200"
                                    >
                                        Créer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showParticipantModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                                Ajouter des participants à la formation
                            </h2>
                            <p className="text-gray-600 mb-4">
                                Formation: {selectedTraining?.title}
                            </p>
                            <form onSubmit={handleParticipantSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Sélectionner les participants
                                    </label>
                                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                        {participants.map(participant => (
                                            <div key={participant.id} className="flex items-center py-2 hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    id={`participant-${participant.id}`}
                                                    value={participant.id}
                                                    checked={selectedParticipants.includes(participant.id)}
                                                    onChange={() => handleParticipantChange(participant.id)}
                                                    className="w-4 h-4 text-marsa-blue border-gray-300 rounded focus:ring-marsa-blue focus:ring-2"
                                                />
                                                <label 
                                                    htmlFor={`participant-${participant.id}`}
                                                    className="ml-3 text-sm text-gray-700 cursor-pointer flex-1"
                                                >
                                                    {participant.fullName}
                                                </label>
                                            </div>
                                        ))}
                                        {participants.length === 0 && (
                                            <p className="text-gray-500 text-sm py-4 text-center">
                                                Aucun participant disponible
                                            </p>
                                        )}
                                    </div>
                                    {selectedParticipants.length > 0 && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''} sélectionné{selectedParticipants.length > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={selectedParticipants.length === 0}
                                        className="flex-1 bg-gradient-to-r from-marsa-blue to-blue-600 text-white py-2 rounded-lg font-medium hover:shadow-lg transition-shadow duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Ajouter ({selectedParticipants.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowParticipantModal(false);
                                            setSelectedTraining(null);
                                            setSelectedParticipants([]);
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Formation;
