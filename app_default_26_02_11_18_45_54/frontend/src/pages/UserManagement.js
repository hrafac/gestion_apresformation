import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { User as UserIcon, Edit, Trash2, Plus, Search, Filter, Mail, Shield, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        fullName: '',
        email: '',
        role: 'PARTICIPANT',
        password: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/auth/users');
            setUsers(response.data);
            setError('');
        } catch (err) {
            setError('Erreur lors du chargement des utilisateurs');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (userId, userData) => {
        try {
            const response = await axios.patch(`/auth/users/${userId}`, userData);
            setUsers(users.map(user => 
                user.id === userId ? response.data : user
            ));
            setShowEditModal(false);
            setError('');
            return true;
        } catch (err) {
            setError('Erreur lors de la mise à jour de l\'utilisateur');
            console.error('Error updating user:', err);
            return false;
        }
    };

    const deleteUser = async (userId) => {
        try {
            await axios.delete(`/auth/users/${userId}`);
            setUsers(users.filter(user => user.id !== userId));
            setError('');
            return true;
        } catch (err) {
            setError('Erreur lors de la suppression de l\'utilisateur');
            console.error('Error deleting user:', err);
            return false;
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setEditFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            role: user.role || 'PARTICIPANT',
            password: ''
        });
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;
        
        const updateData = {
            fullName: editFormData.fullName,
            email: editFormData.email,
            role: editFormData.role
        };
        
        if (editFormData.password.trim()) {
            updateData.password = editFormData.password;
        }
        
        const success = await updateUser(selectedUser.id, updateData);
        if (success) {
            setShowEditModal(false);
            setSelectedUser(null);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
            const success = await deleteUser(userId);
            if (success) {
                // L'utilisateur a été supprimé avec succès
            }
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'formateur':
                return 'bg-blue-100 text-blue-800';
            case 'apprenant':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (active) => {
        return active ? 
            <CheckCircle size={16} className="text-green-500" /> : 
            <XCircle size={16} className="text-red-500" />;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mobile-stack">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mobile-text-sm">Gestion des utilisateurs</h1>
                    <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base mobile-text-xs">Gérez tous les utilisateurs de la plateforme</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mobile-full-width justify-center sm:justify-start"
                >
                    <Plus size={16} className="sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Ajouter</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mobile-card">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mobile-stack">
                    <div className="flex-1 relative">
                        <Search size={16} className="sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 sm:pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-full-width"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mobile-full-width justify-center sm:justify-start">
                        <Filter size={16} className="sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Filtres</span>
                        <span className="sm:hidden">Filtrer</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center gap-3 mobile-card">
                    <AlertCircle size={16} className="sm:w-5 sm:h-5 text-red-500" />
                    <span className="text-red-700 text-sm sm:text-base mobile-text-xs">{error}</span>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mobile-card">
                <div className="overflow-x-auto mobile-table">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider mobile-text-xs">
                                    <span className="hidden sm:inline">Utilisateur</span>
                                    <span className="sm:hidden">Nom</span>
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider mobile-text-xs mobile-hidden">
                                    Email
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider mobile-text-xs">
                                    Rôle
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider mobile-text-xs mobile-hidden">
                                    Statut
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider mobile-text-xs mobile-hidden">
                                    Date
                                </th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider mobile-text-xs">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                                <UserIcon size={12} className="sm:w-4 sm:h-4 text-white" />
                                            </div>
                                            <div className="ml-2 sm:ml-4">
                                                <div className="text-xs sm:text-sm font-medium text-gray-900 mobile-text-xs">
                                                    {user.fullName || 'N/A'}
                                                </div>
                                                <div className="sm:hidden text-xs text-gray-500 mobile-text-xs">
                                                    {user.email || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap mobile-hidden">
                                        <div className="flex items-center text-xs sm:text-sm text-gray-900">
                                            <Mail size={12} className="sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400" />
                                            {user.email || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                            <Shield size={10} className="sm:w-3 sm:h-3 mr-1" />
                                            {user.role || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap mobile-hidden">
                                        <div className="flex items-center text-xs sm:text-sm text-gray-900">
                                            {getStatusIcon(user.active)}
                                            <span className="ml-2">{user.active ? 'Actif' : 'Inactif'}</span>
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap mobile-hidden">
                                        <div className="flex items-center text-xs sm:text-sm text-gray-900">
                                            <Calendar size={12} className="sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400" />
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="p-1 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit size={12} className="sm:w-4 sm:h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="p-1 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={12} className="sm:w-4 sm:h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
