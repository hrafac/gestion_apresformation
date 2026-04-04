import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const QuestionnaireFroid = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const urlUserId = searchParams.get('userId');
    const urlFormationId = searchParams.get('formationId');
    
    // Utiliser l'utilisateur authentifié si pas d'ID dans l'URL
    const userId = urlUserId || (user ? user.id : null);
    const [formationId, setFormationId] = useState(urlFormationId || null);
    const [questionnaires, setQuestionnaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [formations, setFormations] = useState([]);
    const [formationsLoading, setFormationsLoading] = useState(false);

    useEffect(() => {
        fetchQuestionnairesFroid();
        if (user && user.role === 'PARTICIPANT') {
            fetchFormations();
        }
    }, []);

    const fetchFormations = async () => {
        setFormationsLoading(true);
        try {
            const response = await axios.get('/training/participant/' + user.id);
            // L'API retourne { formations: [...] } au lieu d'un tableau direct
            const formationsData = response.data.formations || [];
            // S'assurer que c'est bien un tableau
            const formationsArray = Array.isArray(formationsData) ? formationsData : [];
            
            console.log('Toutes les formations du participant:', formationsArray);
            
            // Filtrer les formations terminées depuis 56 heures ou plus
            const fiftySixHoursAgo = new Date();
            fiftySixHoursAgo.setHours(fiftySixHoursAgo.getHours() - 56);
            console.log('Date limite (56h avant):', fiftySixHoursAgo);
            
            const eligibleFormations = formationsArray.filter(formation => {
                console.log('Formation analysée:', {
                    id: formation.id,
                    title: formation.title,
                    endDateTime: formation.endDateTime,
                    startDateTime: formation.startDateTime,
                    status: formation.status
                });
                
                // Si pas de endDateTime, on considère que la formation est éligible si le statut est TERMINEE
                if (!formation.endDateTime) {
                    console.log('Formation sans endDateTime, vérification du statut:', formation.status);
                    return formation.status === 'TERMINEE';
                }
                
                const endDate = new Date(formation.endDateTime);
                const isEligible = endDate <= fiftySixHoursAgo && formation.status === 'TERMINEE';
                console.log('Date fin formation:', endDate, 'Éligible:', isEligible);
                return isEligible;
            });
            
            setFormations(eligibleFormations);
            console.log('Formations éligibles finales:', eligibleFormations);
        } catch (err) {
            console.error('Erreur lors du chargement des formations:', err);
            setFormations([]); // Initialiser avec un tableau vide en cas d'erreur
        } finally {
            setFormationsLoading(false);
        }
    };

    const fetchQuestionnairesFroid = async () => {
        try {
            const response = await axios.get('http://backend:8080/public/questionnaireFroid');
            setQuestionnaires(response.data);
            setLoading(false);
        } catch (err) {
            setError('Erreur lors du chargement des questionnaires froids');
            setLoading(false);
        }
    };

    const handleQuestionnaireSelect = (questionnaire) => {
        setSelectedQuestionnaire(questionnaire);
        setAnswers({});
        setSubmitted(false);
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedQuestionnaire) return;

        // Validation : pour les participants, une formation éligible est requise
        if (user && user.role === 'PARTICIPANT' && !formationId) {
            alert('Veuillez sélectionner une formation terminée depuis au moins 56 heures pour pouvoir répondre au questionnaire froid.');
            return;
        }

        // Validation
        if (!userId) {
            alert('Erreur: utilisateur non identifié. Veuillez vous reconnecter.');
            return;
        }

        // Si formationId est requis, ajouter cette validation
        // if (!formationId) {
        //     alert('Erreur: formation non spécifiée.');
        //     return;
        // }

        const unansweredQuestions = selectedQuestionnaire.questions.filter(
            q => !answers[q.id] || answers[q.id].trim() === ''
        );

        if (unansweredQuestions.length > 0) {
            alert('Veuillez répondre à toutes les questions avant de soumettre.');
            return;
        }

        try {
            // Préparer les réponses pour l'envoi
            const responses = selectedQuestionnaire.questions.map(question => {
                const response = {
                    questionId: question.id,
                    userId: userId,
                    value: answers[question.id] || ''
                };
                
                // Ajouter formationId seulement s'il existe
                if (formationId) {
                    response.idTraining = formationId;
                }
                
                return response;
            });

            console.log('Envoi des réponses:', responses);

            // Envoyer les réponses
            await axios.post('/response/submit', responses);
            
            setSubmitted(true);
            alert('Questionnaire froid soumis avec succès !');
        } catch (err) {
            alert('Erreur lors de la soumission du questionnaire froid');
            console.error('Error submitting questionnaire froid:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement des questionnaires froids...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <div className="text-red-800">
                        <p className="font-semibold">Erreur</p>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    Questionnaires d'Évaluation Froid
                </h1>

                {/* Sélecteur de formation */}
                {user && user.role === 'PARTICIPANT' && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Sélectionner une formation terminée depuis 56 heures minimum
                        </h3>
                        <div className="flex items-center gap-4">
                            <select
                                value={formationId || ''}
                                onChange={(e) => setFormationId(e.target.value || null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                                disabled={formationsLoading}
                            >
                                <option value="">-- Sélectionner une formation --</option>
                                {formations.map((formation) => {
                                    let dateText = 'Date non spécifiée';
                                    if (formation.endDateTime) {
                                        const endDate = new Date(formation.endDateTime);
                                        dateText = 'Terminée le: ' + endDate.toLocaleDateString('fr-FR') + ' ' + endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                    }
                                    return (
                                        <option key={formation.id} value={formation.id}>
                                            {formation.title} - {formation.theme} ({dateText})
                                        </option>
                                    );
                                })}
                            </select>
                            {formationsLoading && (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600"></div>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Seules les formations terminées depuis au moins 56 heures sont éligibles pour l'évaluation froid.
                            {formations.length === 0 && !formationsLoading && " Aucune formation éligible trouvée."}
                        </p>
                    </div>
                )}

                {!selectedQuestionnaire ? (
                    // Liste des questionnaires froids
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {questionnaires.map((questionnaire) => (
                            <div
                                key={questionnaire.id}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-200"
                                onClick={() => handleQuestionnaireSelect(questionnaire)}
                            >
                                <div className="flex items-center mb-4">
                                    <div className="bg-cyan-100 rounded-full p-3 mr-4">
                                        <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {questionnaire.title}
                                        </h3>
                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-cyan-100 text-cyan-800 rounded-full">
                                            {questionnaire.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-gray-600">
                                    <p className="text-sm">
                                        {questionnaire.questions?.length || 0} question{(questionnaire.questions?.length || 0) > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="mt-4 text-cyan-600 text-sm font-medium">
                                    Commencer le questionnaire froid →
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Formulaire du questionnaire froid sélectionné
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="mb-6">
                                <button
                                    onClick={() => setSelectedQuestionnaire(null)}
                                    className="flex items-center text-cyan-600 hover:text-cyan-800 mb-4"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Retour à la liste
                                </button>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {selectedQuestionnaire.title}
                                </h2>
                                <p className="text-gray-600 mt-2">
                                    Veuillez répondre à toutes les questions ci-dessous
                                </p>
                            </div>

                            {submitted ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                    <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
                                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                                        Questionnaire froid soumis avec succès !
                                    </h3>
                                    <p className="text-green-700 mb-4">
                                        Merci d'avoir pris le temps de répondre à ce questionnaire d'évaluation froid.
                                    </p>
                                    <button
                                        onClick={() => setSelectedQuestionnaire(null)}
                                        className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
                                    >
                                        Retour à la liste
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-6">
                                        {selectedQuestionnaire.questions.map((question, index) => (
                                            <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                                                <label className="block text-gray-900 font-medium mb-2">
                                                    <span className="inline-block bg-cyan-100 text-cyan-800 rounded-full px-3 py-1 text-sm mr-3">
                                                        {index + 1}
                                                    </span>
                                                    {question.text}
                                                </label>
                                                <textarea
                                                    value={answers[question.id] || ''}
                                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                                                    rows={4}
                                                    placeholder="Votre réponse..."
                                                    required
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                        <button
                                            type="submit"
                                            className="bg-cyan-600 text-white px-8 py-3 rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                                        >
                                            Soumettre le questionnaire froid
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionnaireFroid;
