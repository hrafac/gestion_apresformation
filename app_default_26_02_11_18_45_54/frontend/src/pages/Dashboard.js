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
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-8 text-marsa-blue">Tableau de Bord RH</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow">
                    <h2 className="text-xl font-semibold mb-4 text-marsa-orange">Formations Récentes</h2>
                    <div className="space-y-4">
                        {trainings.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-4 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => fetchStats(t.id)}>
                                <div>
                                    <p className="font-bold">{t.title}</p>
                                    <p className="text-sm text-gray-500">{t.theme} - {t.startDate}</p>
                                </div>
                                <button className="bg-marsa-blue text-white px-3 py-1 rounded text-sm">Voir Stats</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow">
                    <h2 className="text-xl font-semibold mb-4">Analyse Qualitative (Chaud)</h2>
                    {stats ? (
                        <div className="h-96 flex items-center justify-center">
                            <Radar data={stats} />
                        </div>
                    ) : (
                        <div className="text-gray-400 text-center py-20">Sélectionnez une formation pour voir l'analyse radar</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
