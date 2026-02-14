import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', credentials);
            login(res.data.user, res.data.token);
            navigate('/');
        } catch (err) {
            alert('Identifiants invalides');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-marsa-blue text-center">Connexion</h2>
                <div className="mb-4">
                    <label className="block mb-2">Utilisateur</label>
                    <input 
                        type="text" 
                        className="w-full p-2 border rounded" 
                        onChange={e => setCredentials({...credentials, username: e.target.value})}
                    />
                </div>
                <div className="mb-6">
                    <label className="block mb-2">Mot de passe</label>
                    <input 
                        type="password" 
                        className="w-full p-2 border rounded" 
                        onChange={e => setCredentials({...credentials, password: e.target.value})}
                    />
                </div>
                <button className="w-full bg-marsa-blue text-white py-2 rounded hover:bg-blue-800 font-bold">
                    Se Connecter
                </button>
            </form>
        </div>
    );
};

export default Login;
