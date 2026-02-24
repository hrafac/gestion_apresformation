import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import Formation from './pages/Formation';
import UserManagement from './pages/UserManagement';
import Questionnaire from './pages/Questionnaire';
import MesFormations from './pages/MesFormations';

const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? <Navbar>{children}</Navbar> : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/formations" element={
                        <PrivateRoute>
                            <Formation />
                        </PrivateRoute>
                    } />
                    <Route path="/mes-formations" element={
                        <PrivateRoute>
                            <MesFormations />
                        </PrivateRoute>
                    } />
                    <Route path="/users" element={
                        <PrivateRoute>
                            <UserManagement />
                        </PrivateRoute>
                    } />
                    <Route path="/questionnaire" element={<Questionnaire />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
