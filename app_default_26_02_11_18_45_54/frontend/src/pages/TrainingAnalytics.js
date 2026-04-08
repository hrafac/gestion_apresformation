import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

const TrainingAnalytics = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalFormations: 0,
        totalUsers: 0,
        participantCount: 0,
        completedFormations: 0
    });
    const [analysisServiceStatus, setAnalysisServiceStatus] = useState('unknown'); // 'available', 'unavailable', 'unknown'

    // Health check pour le service d'analyse
    const checkAnalysisServiceHealth = async () => {
        try {
            const response = await fetch('https://gestion-apresformation-1-python.onrender.com/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const isHealthy = response.ok;
            setAnalysisServiceStatus(isHealthy ? 'available' : 'unavailable');
            return isHealthy;
        } catch (err) {
            console.warn('Analysis service health check failed:', err);
            setAnalysisServiceStatus('unavailable');
            return false;
        }
    };

    // Enregistrer les composants Chart.js
    ChartJS.register(
        CategoryScale,
        LinearScale,
        BarElement,
        ArcElement,
        Title,
        Tooltip,
        Legend
    );

    const getParticipantCount = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://gestion-apresformation.onrender.com/api/auth/users/participants/count', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const count = await response.json();
            return count;
        } catch (err) {
            console.error('Error fetching participant count:', err);
            return 0;
        }
    };

    const getTotalFormations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://gestion-apresformation.onrender.com/api/training/count/total', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.totalFormations || 0;
        } catch (err) {
            console.error('Error fetching total formations:', err);
            return 0;
        }
    };

    const getCompletedFormations = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://gestion-apresformation.onrender.com/api/training/count/completed', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.completedFormations || 0;
        } catch (err) {
            console.error('Error fetching completed formations:', err);
            return 0;
        }
    };

    // Charger les statistiques au démarrage
    useEffect(() => {
        loadInitialStats();
        // Vérifier le statut du service d'analyse
        checkAnalysisServiceHealth();
    }, []);

    const loadInitialStats = async () => {
        try {
            // Charger les statistiques de base depuis le service principal (port 8080)
            const [participantCount, totalFormations, completedFormations] = await Promise.all([
                getParticipantCount(),
                getTotalFormations(),
                getCompletedFormations()
            ]);
            
            setStats({
                totalFormations: totalFormations,
                totalUsers: 0, // On peut garder cette valeur pour compatibilité
                participantCount: participantCount,
                completedFormations: completedFormations
            });

            // Essayer de charger les données d'analyse si le service est disponible
            try {
                const isServiceHealthy = await checkAnalysisServiceHealth();
                if (isServiceHealthy) {
                    await handleGetAnalysisInfo();
                }
            } catch (analysisErr) {
                console.warn('Analysis service not available on load:', analysisErr);
                // Ne pas échouer le chargement initial si le service d'analyse n'est pas disponible
            }
        } catch (err) {
            console.error('Error loading initial stats:', err);
            // En cas d'erreur, essayer au moins de récupérer le nombre de participants
            try {
                const participantCount = await getParticipantCount();
                setStats(prev => ({
                    ...prev,
                    participantCount: participantCount
                }));
            } catch (fallbackErr) {
                console.error('Failed to load even basic stats:', fallbackErr);
            }
        }
    };

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Vérifier si le service d'analyse est disponible
            const isServiceHealthy = await checkAnalysisServiceHealth();
            if (!isServiceHealthy) {
                throw new Error('Le service d\'analyse n\'est pas disponible. Veuillez vérifier que le service sur le port 8000 est en cours d\'exécution.');
            }

            // D'abord faire le POST pour lancer l'analyse
            const postResponse = await fetch('https://gestion-apresformation-1-python.onrender.com/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    database_config: {
                        host: "dpg-d79f5jbuibrs73c5ugs0-a.oregon-postgres.render.com",
                        database: "marsa_eval",
                        user: "marsa_user",
                        password: "HaQUe0hlwZvaS2MPn6egMB1l2JdeWcIf",
                        port: 5432
                    },
                    analysis_type: "full",
                    n_topics: 3,
                    contamination: 0.1
                })
            });

            if (!postResponse.ok) {
                throw new Error(`POST HTTP error! status: ${postResponse.status}`);
            }

            const postData = await postResponse.json();
            setResult(postData);
            
            // Attendre un peu pour que l'analyse se lance
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Ensuite faire le GET pour récupérer les informations avec retry
            let getResponse;
            let retries = 3;
            let success = false;
            
            while (retries > 0 && !success) {
                try {
                    getResponse = await fetch('https://gestion-apresformation-1-python.onrender.com/analyze', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    if (getResponse.ok) {
                        success = true;
                    } else if (getResponse.status === 404) {
                        // Si 404, attendre et réessayer
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        retries--;
                    } else {
                        throw new Error(`GET HTTP error! status: ${getResponse.status}`);
                    }
                } catch (err) {
                    if (retries > 1) {
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        retries--;
                    } else {
                        throw err;
                    }
                }
            }
            
            if (!success) {
                throw new Error('L\'analyse n\'a pas pu être récupérée après plusieurs tentatives');
            }

            const getData = await getResponse.json();
            
            // Utiliser les données du GET (info) comme résultat principal
            setResult(getData);
            
            // Extraire les statistiques des résultats ou utiliser des valeurs par défaut
            const [participantCount, totalFormations, completedFormations] = await Promise.all([
                getParticipantCount(),
                getTotalFormations(),
                getCompletedFormations()
            ]);
            
            if (postData.statistics) {
                setStats({
                    totalFormations: totalFormations,
                    totalUsers: postData.statistics.total_users || 0,
                    participantCount: participantCount,
                    completedFormations: completedFormations
                });
            } else if (getData.database_info) {
                setStats({
                    totalFormations: totalFormations,
                    totalUsers: getData.database_info.total_users || 0,
                    participantCount: participantCount,
                    completedFormations: completedFormations
                });
            } else {
                // Données simulées pour démonstration
                setStats({
                    totalFormations: totalFormations,
                    totalUsers: 48,
                    participantCount: participantCount,
                    completedFormations: completedFormations
                });
            }
            
            console.log('POST Analysis result:', postData);
            console.log('GET Analysis info:', getData);
            console.log('Final result set:', getData);
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message);
            
            // Fallback: utiliser les statistiques de base même si l'analyse échoue
            try {
                const [participantCount, totalFormations, completedFormations] = await Promise.all([
                    getParticipantCount(),
                    getTotalFormations(),
                    getCompletedFormations()
                ]);
                
                setStats({
                    totalFormations: totalFormations,
                    totalUsers: participantCount, // Utiliser participantCount comme fallback
                    participantCount: participantCount,
                    completedFormations: completedFormations
                });
                
                setResult({
                    graphs: {
                        verdicts_distribution: {
                            labels: ['Données limitées'],
                            values: [1],
                            percentages: [100]
                        }
                    },
                    data: {
                        quality_by_formation: [],
                        top_comments: {
                            positifs: ['Service d\'analyse temporairement indisponible'],
                            negatifs: []
                        }
                    }
                });
                
                console.log('Fallback stats loaded successfully');
            } catch (fallbackErr) {
                console.error('Fallback also failed:', fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGetAnalysisInfo = async () => {
        setLoading(true);
        setError(null);

        try {
            // Vérifier si le service d'analyse est disponible
            const isServiceHealthy = await checkAnalysisServiceHealth();
            if (!isServiceHealthy) {
                throw new Error('Le service d\'analyse n\'est pas disponible. Veuillez vérifier que le service sur le port 8000 est en cours d\'exécution.');
            }

            let response;
            let retries = 3;
            let success = false;
            
            while (retries > 0 && !success) {
                try {
                    response = await fetch('https://gestion-apresformation-1-python.onrender.com/analyze', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    if (response.ok) {
                        success = true;
                    } else if (response.status === 404) {
                        // Si 404, attendre et réessayer
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        retries--;
                    } else {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                } catch (err) {
                    if (retries > 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        retries--;
                    } else {
                        throw err;
                    }
                }
            }
            
            if (!success) {
                throw new Error('Impossible de récupérer les informations d\'analyse après plusieurs tentatives');
            }

            const data = await response.json();
            
            // Update stats with the retrieved information
            const [participantCount, totalFormations, completedFormations] = await Promise.all([
                getParticipantCount(),
                getTotalFormations(),
                getCompletedFormations()
            ]);
            
            if (data.database_info) {
                setStats({
                    totalFormations: totalFormations,
                    totalUsers: data.database_info.total_users || 0,
                    participantCount: participantCount,
                    completedFormations: completedFormations
                });
            } else {
                setStats({
                    totalFormations: totalFormations,
                    totalUsers: 0,
                    participantCount: participantCount,
                    completedFormations: completedFormations
                });
            }
            
            console.log('Analysis info:', data);
            return data;
        } catch (err) {
            setError(err.message);
            console.error('Get analysis info error:', err);
            
            // Fallback: charger les statistiques de base
            try {
                const [participantCount, totalFormations, completedFormations] = await Promise.all([
                    getParticipantCount(),
                    getTotalFormations(),
                    getCompletedFormations()
                ]);
                
                setStats({
                    totalFormations: totalFormations,
                    totalUsers: participantCount,
                    participantCount: participantCount,
                    completedFormations: completedFormations
                });
                
                console.log('Fallback stats loaded in handleGetAnalysisInfo');
            } catch (fallbackErr) {
                console.error('Fallback failed in handleGetAnalysisInfo:', fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    };

    // Données pour le graphique camembert
    const pieData = {
        labels: ['Formations Terminées', 'Formations en Cours'],
        datasets: [
            {
                label: 'Répartition des formations',
                data: [stats.completedFormations, stats.totalFormations - stats.completedFormations],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(59, 130, 246, 0.85)'
                ],
                borderColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 2,
                hoverBackgroundColor: [
                    'rgba(16, 185, 129, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                hoverBorderWidth: 3,
                hoverOffset: 8
            },
        ],
    };

    // Données pour l'histogramme des statistiques générales
    const barData = {
        labels: ['Total Formations', 'Utilisateurs Inscrits', 'Formations Terminées'],
        datasets: [
            {
                label: 'Statistiques',
                data: [stats.totalFormations, stats.totalUsers, stats.completedFormations],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.85)',
                    'rgba(16, 185, 129, 0.85)',
                    'rgba(139, 92, 246, 0.85)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(139, 92, 246, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8,
                hoverBackgroundColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(139, 92, 246, 1)'
                ]
            },
        ],
    };

    // Données pour l'histogramme de qualité par formation
    const qualityByFormationData = result?.data?.quality_by_formation ? {
        labels: result.data.quality_by_formation.map(item => item.formation),
        datasets: [
            {
                label: 'Score de Qualité',
                data: result.data.quality_by_formation.map(item => item.score),
                verdicts: result.data.quality_by_formation.map(item => item.verdict),
                backgroundColor: result.data.quality_by_formation.map(item => {
                    if (item.verdict.includes('BONNE')) return 'rgba(16, 185, 129, 0.85)';
                    if (item.verdict.includes('MOYENNE')) return 'rgba(245, 158, 11, 0.85)';
                    return 'rgba(239, 68, 68, 0.85)';
                }),
                borderColor: result.data.quality_by_formation.map(item => {
                    if (item.verdict.includes('BONNE')) return 'rgba(16, 185, 129, 1)';
                    if (item.verdict.includes('MOYENNE')) return 'rgba(245, 158, 11, 1)';
                    return 'rgba(239, 68, 68, 1)';
                }),
                borderWidth: 2,
                borderRadius: 6,
                hoverBackgroundColor: result.data.quality_by_formation.map(item => {
                    if (item.verdict.includes('BONNE')) return 'rgba(16, 185, 129, 1)';
                    if (item.verdict.includes('MOYENNE')) return 'rgba(245, 158, 11, 1)';
                    return 'rgba(239, 68, 68, 1)';
                })
            },
        ],
    } : null;

    // Données pour le graphe camembert de distribution des verdicts
    const verdictsDistributionData = result?.graphs?.verdicts_distribution ? {
        labels: result.graphs.verdicts_distribution.labels.map((label, index) => 
            `${label} (${result.graphs.verdicts_distribution.percentages[index]}%)`
        ),
        datasets: [
            {
                data: result.graphs.verdicts_distribution.percentages,
                backgroundColor: result.graphs.verdicts_distribution.labels.map(label => {
                    if (label.includes('BONNE')) return 'rgba(16, 185, 129, 0.85)';
                    if (label.includes('MOYENNE')) return 'rgba(245, 158, 11, 0.85)';
                    return 'rgba(239, 68, 68, 0.85)';
                }),
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverBackgroundColor: result.graphs.verdicts_distribution.labels.map(label => {
                    if (label.includes('BONNE')) return 'rgba(16, 185, 129, 1)';
                    if (label.includes('MOYENNE')) return 'rgba(245, 158, 11, 1)';
                    return 'rgba(239, 68, 68, 1)';
                }),
                hoverBorderWidth: 4,
                hoverOffset: 10
            },
        ],
    } : null;

    // Données pour le graphe camembert de distribution des sentiments
    const sentimentsDistributionData = result?.graphs?.sentiments_distribution ? {
        labels: result.graphs.sentiments_distribution.labels.map((label, index) => 
            `${label} (${result.graphs.sentiments_distribution.percentages[index]}%)`
        ),
        datasets: [
            {
                data: result.graphs.sentiments_distribution.percentages,
                backgroundColor: result.graphs.sentiments_distribution.labels.map(label => {
                    if (label.includes('positif')) return 'rgba(16, 185, 129, 0.85)';
                    if (label.includes('neutre')) return 'rgba(107, 114, 128, 0.85)';
                    return 'rgba(239, 68, 68, 0.85)';
                }),
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverBackgroundColor: result.graphs.sentiments_distribution.labels.map(label => {
                    if (label.includes('positif')) return 'rgba(16, 185, 129, 1)';
                    if (label.includes('neutre')) return 'rgba(107, 114, 128, 1)';
                    return 'rgba(239, 68, 68, 1)';
                }),
                hoverBorderWidth: 4,
                hoverOffset: 10
            },
        ],
    } : null;

    // Options pour les graphiques camembert
    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    font: {
                        size: 14,
                        weight: '600',
                        family: 'system-ui, -apple-system, sans-serif'
                    },
                    color: '#374151'
                }
            },
            title: {
                display: true,
                text: 'Répartition des Formations',
                font: {
                    size: 18,
                    weight: '700',
                    family: 'system-ui, -apple-system, sans-serif'
                },
                color: '#1f2937',
                padding: {
                    top: 10,
                    bottom: 30
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleFont: {
                    size: 14,
                    weight: '600'
                },
                bodyFont: {
                    size: 13
                },
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500,
            easing: 'easeInOutQuart'
        }
    };

    // Options pour l'histogramme des statistiques générales
    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Statistiques Générales',
                font: {
                    size: 18,
                    weight: '700',
                    family: 'system-ui, -apple-system, sans-serif'
                },
                color: '#1f2937',
                padding: {
                    top: 10,
                    bottom: 30
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleFont: {
                    size: 14,
                    weight: '600'
                },
                bodyFont: {
                    size: 13
                },
                padding: 12,
                cornerRadius: 8,
                displayColors: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    color: '#6b7280',
                    padding: 10
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 12,
                        weight: '600'
                    },
                    color: '#374151',
                    padding: 10
                }
            }
        },
        animation: {
            duration: 1500,
            easing: 'easeInOutQuart',
            delay: (context) => {
                let delay = 0;
                if (context.type === 'data' && context.mode === 'default') {
                    delay = context.dataIndex * 200;
                }
                return delay;
            }
        }
    };

    // Options spécifiques pour l'histogramme horizontal de qualité par formation
    const qualityChartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        indexAxis: 'y',
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Qualité par Formation',
                font: {
                    size: 18,
                    weight: '700',
                    family: 'system-ui, -apple-system, sans-serif'
                },
                color: '#1f2937',
                padding: {
                    top: 10,
                    bottom: 30
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleFont: {
                    size: 14,
                    weight: '600'
                },
                bodyFont: {
                    size: 13
                },
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        const score = context.parsed.x;
                        const verdict = context.dataset.verdicts?.[context.dataIndex] || '';
                        return `Score: ${score.toFixed(2)} ${verdict}`;
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    color: '#6b7280',
                    padding: 10,
                    callback: function(value) {
                        return value + '%';
                    }
                },
                title: {
                    display: true,
                    text: 'Score de Qualité',
                    font: {
                        size: 14,
                        weight: '600'
                    },
                    color: '#374151'
                }
            },
            y: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 13,
                        weight: '600'
                    },
                    color: '#374151',
                    padding: 10
                },
                title: {
                    display: true,
                    text: 'Formations',
                    font: {
                        size: 14,
                        weight: '600'
                    },
                    color: '#374151'
                }
            }
        },
        animation: {
            duration: 1500,
            easing: 'easeInOutQuart',
            delay: (context) => {
                let delay = 0;
                if (context.type === 'data' && context.mode === 'default') {
                    delay = context.dataIndex * 150;
                }
                return delay;
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* En-tête */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 backdrop-blur-lg bg-opacity-95">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">Tableau de Bord Analytique</h1>
                        <p className="text-gray-600 text-lg">Analyse intelligente des données de formation avec IA</p>
                    </div>
                </div>

                {/* Boîtes statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Box Formations */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <p className="text-blue-100 font-medium mb-2 text-sm uppercase tracking-wide">Total Formations</p>
                            <p className="text-5xl font-bold text-white mb-2">{stats.totalFormations}</p>
                            <p className="text-blue-100 text-sm">Formations disponibles</p>
                        </div>
                    </div>

                    {/* Box Utilisateurs */}
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <p className="text-emerald-100 font-medium mb-2 text-sm uppercase tracking-wide">Total Participants</p>
                            <p className="text-5xl font-bold text-white mb-2">{stats.participantCount}</p>
                            <p className="text-emerald-100 text-sm">Participants inscrits</p>
                        </div>
                    </div>

                    {/* Box Formations Terminées */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-purple-100 font-medium mb-2 text-sm uppercase tracking-wide">Formations Terminées</p>
                            <p className="text-5xl font-bold text-white mb-2">{stats.completedFormations}</p>
                            <div className="flex items-center gap-2">
                                <div className="w-16 bg-white bg-opacity-20 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full" style={{width: `${stats.totalFormations > 0 ? (stats.completedFormations / stats.totalFormations) * 100 : 0}%`}}></div>
                                </div>
                                <p className="text-purple-100 text-sm font-medium">
                                    {stats.totalFormations > 0 ? Math.round((stats.completedFormations / stats.totalFormations) * 100) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Graphiques d'analyse (uniquement si des données sont disponibles) */}
                {result && (
                    <div className="space-y-8 mb-8">
                        {/* Histogramme de qualité par formation */}
                        {qualityByFormationData && (
                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-lg bg-opacity-95">
                                <div className="flex items-center justify-center mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mr-3">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-800">Qualité par Formation</h2>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-6">
                                    <Bar data={qualityByFormationData} options={qualityChartOptions} />
                                </div>
                            </div>
                        )}

                        {/* Graphiques de distribution sur la même ligne */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Distribution des verdicts */}
                            {verdictsDistributionData && (
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-lg bg-opacity-95 transform hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center justify-center mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800">Distribution des Verdicts</h2>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <Pie data={verdictsDistributionData} options={pieChartOptions} />
                                    </div>
                                </div>
                            )}

                            {/* Distribution des sentiments */}
                            {sentimentsDistributionData && (
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-lg bg-opacity-95 transform hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center justify-center mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800">Distribution des Sentiments</h2>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <Pie data={sentimentsDistributionData} options={pieChartOptions} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Bouton d'analyse */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 backdrop-blur-lg bg-opacity-95">
                    <div className="text-center">
                        {/* Indicateur de statut du service d'analyse */}
                        <div className="mb-4 flex items-center justify-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                                analysisServiceStatus === 'available' ? 'bg-green-500' : 
                                analysisServiceStatus === 'unavailable' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-sm text-gray-600">
                                Service d'analyse: {
                                    analysisServiceStatus === 'available' ? 'Disponible' :
                                    analysisServiceStatus === 'unavailable' ? 'Indisponible' :
                                    'Vérification...'
                                }
                            </span>
                        </div>
                        
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || analysisServiceStatus === 'unavailable'}
                            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                                loading || analysisServiceStatus === 'unavailable'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed scale-95'
                                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Analyse en cours...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>Lancer l'analyse</span>
                                </div>
                            )}
                        </button>
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-center">{error}</p>
                            </div>
                        )}
                        
                        {analysisServiceStatus === 'unavailable' && !error && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-yellow-700 text-center text-sm">
                                    Le service d'analyse avancée n'est pas disponible. 
                                    Les statistiques de base sont toujours fonctionnelles.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

             

                
            </div>
        </div>
    );
};

export default TrainingAnalytics;
