import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const Questionnaire = () => {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const formationId = searchParams.get('formationId');
    const [questionnaires, setQuestionnaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        fetchQuestionnaires();
    }, []);

    const fetchQuestionnaires = async () => {
        try {
            const response = await axios.get('https://gestion-apresformation.onrender.com/public/questionnaireChaud');
            setQuestionnaires(response.data);
            setLoading(false);
        } catch (err) {
            setError('Erreur lors du chargement des questionnaires');
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

        // Validation
        const unansweredQuestions = selectedQuestionnaire.questions.filter(
            q => !answers[q.id] || answers[q.id].trim() === ''
        );

        if (unansweredQuestions.length > 0) {
            alert('Veuillez répondre à toutes les questions avant de soumettre.');
            return;
        }

        try {
            // Préparer les réponses pour l'envoi
            const responses = selectedQuestionnaire.questions.map(question => ({
                questionId: question.id,
                userId: userId, // Inclure l'ID utilisateur
                idTraining: formationId, // Inclure l'ID de formation
                value: answers[question.id] || ''
            }));

            // Envoyer les réponses
            await axios.post('https://gestion-apresformation.onrender.com/api/response/submit', responses);
            
            setSubmitted(true);
            alert('Questionnaire soumis avec succès !');
        } catch (err) {
            alert('Erreur lors de la soumission du questionnaire');
            console.error('Error submitting questionnaire:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement des questionnaires...</p>
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
                    Questionnaires d'Évaluation
                </h1>

                {!selectedQuestionnaire ? (
                    // Liste des questionnaires
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {questionnaires.map((questionnaire) => (
                            <div
                                key={questionnaire.id}
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer border border-gray-200"
                                onClick={() => handleQuestionnaireSelect(questionnaire)}
                            >
                                <div className="flex items-center mb-4">
                                    <div className="bg-blue-100 rounded-full p-3 mr-4">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {questionnaire.title}
                                        </h3>
                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                            {questionnaire.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-gray-600">
                                    <p className="text-sm">
                                        {questionnaire.questions?.length || 0} question{(questionnaire.questions?.length || 0) > 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="mt-4 text-blue-600 text-sm font-medium">
                                    Commencer le questionnaire →
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Formulaire du questionnaire sélectionné
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="mb-6">
                                <button
                                    onClick={() => setSelectedQuestionnaire(null)}
                                    className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
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
                                        Questionnaire soumis avec succès !
                                    </h3>
                                    <p className="text-green-700 mb-4">
                                        Merci d'avoir pris le temps de répondre à ce questionnaire.
                                    </p>
                                    <button
                                        onClick={() => setSelectedQuestionnaire(null)}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                                                    <span className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm mr-3">
                                                        {index + 1}
                                                    </span>
                                                    {question.text}
                                                </label>
                                                <textarea
                                                    value={answers[question.id] || ''}
                                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
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
                                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            Soumettre le questionnaire
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

export default Questionnaire;
