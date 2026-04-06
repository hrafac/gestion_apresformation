import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const Dashboard = () => {
    const [trainings, setTrainings] = useState([]);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        api.get('/rh/trainings').then(res => setTrainings(res.data));
    }, []);

    const fetchStats = async (id) => {
        // Mock data logic for radar demonstration if real stats are empty
        const res = await api.get(`/rh/stats/${id}`);
        const labels = Object.keys(res.data);
        const dataValues = Object.values(res.data);

        setStats({
            labels: labels.length > 0 ? labels : ['Contenu', 'Formateur', 'Logistique', 'Objectifs', 'Supports'],
            datasets: [{
                label: 'Score Moyen (Likert 1-5)',
                data: dataValues.length > 0 ? dataValues : [4.2, 4.5, 3.8, 4.0, 4.1],
                backgroundColor: 'rgba(0, 74, 153, 0.2)',
                borderColor: 'rgba(0, 74, 153, 1)',
                borderWidth: 2,
            }]
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                <section className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-marsa-orange to-orange-500 px-4 sm:px-6 py-3 sm:py-4">
                        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Formations Récentes
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                        <div className="space-y-3">
                            {trainings.map(t => (
                                <div key={t.id} className="group flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-marsa-blue hover:shadow-md cursor-pointer transition-all duration-200 bg-gray-50 hover:bg-white" onClick={() => fetchStats(t.id)}>
                                    <div className="flex-1 mb-3 sm:mb-0">
                                        <p className="font-semibold text-gray-800 group-hover:text-marsa-blue transition-colors text-sm sm:text-base">{t.title}</p>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                            <span className="inline-flex items-center">
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                                {t.theme}
                                            </span>
                                            <span className="mx-2">•</span>
                                            <span className="inline-flex items-center">
                                                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {t.startDate}
                                            </span>
                                        </p>
                                    </div>
                                    <button className="ml-0 sm:ml-4 bg-gradient-to-r from-marsa-blue to-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto">
                                        Voir Stats
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 sm:px-6 py-3 sm:py-4">
                        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Analyse Qualitative (Chaud)
                        </h2>
                    </div>
                    <div className="p-4 sm:p-6">
                        {stats ? (
                            <div className="h-64 sm:h-96 flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-2 sm:p-4">
                                <Radar data={stats} />
                            </div>
                        ) : (
                            <div className="text-gray-400 text-center py-12 sm:py-20 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
                                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-base sm:text-lg font-medium">Sélectionnez une formation</p>
                                <p className="text-xs sm:text-sm mt-2">pour voir l'analyse radar</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
