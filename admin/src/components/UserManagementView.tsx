import React, { useState } from 'react';
import { User } from '../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  SlidersHorizontal, 
  RefreshCw, 
  ShieldCheck, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Eye,
  FileText,
  Download,
  MessageSquare,
  Send,
  PhoneCall
} from 'lucide-react';

interface UserManagementViewProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateKyc: (id: string, status: 'VERIFIED' | 'PENDING' | 'REJECTED') => void;
  onToggleSuspend: (id: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onAddUser,
  onUpdateKyc,
  onToggleSuspend
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [adminMessageInput, setAdminMessageInput] = useState('');

  const handleSendAdminMessage = async () => {
    if (!adminMessageInput.trim() || !selectedUserForDetails) return;
    const textToSend = adminMessageInput;
    setAdminMessageInput('');

    try {
      const token = localStorage.getItem('admin_token') || '';
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3001/api';
      const res = await fetch(`${API_BASE}/admin/chat/${selectedUserForDetails.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: textToSend })
      });
      alert(res.ok
        ? `💬 Message envoyé à ${selectedUserForDetails.name} !`
        : `⚠️ Échec de l'envoi (erreur ${res.status}). Reconnectez-vous puis réessayez.`);
    } catch (err) {
      alert('⚠️ Échec de l\'envoi : serveur injoignable.');
    }
  };
  const [previewDocument, setPreviewDocument] = useState<{ title: string; type: 'IMAGE' | 'PDF'; subtitle: string; contentText: string; imageUrl?: string } | null>(null);


  // Form states for new user
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserAccountType, setNewUserAccountType] = useState<'Standard' | 'Premium'>('Standard');
  const [newUserKyc, setNewUserKyc] = useState<'VERIFIED' | 'PENDING' | 'REJECTED'>('PENDING');

  // Filter clients
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesKyc = kycFilter === '' ? true : u.kycStatus === kycFilter;
    const matchesAccount = accountFilter === '' ? true : u.accountType === accountFilter;

    return matchesSearch && matchesKyc && matchesAccount;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    // Trigger parent add callback
    onAddUser({
      name: newUserName,
      email: newUserEmail,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', // Default gorgeous avatar
      accountType: newUserAccountType,
      kycStatus: newUserKyc,
      lastActivityDate: 'À l\'instant',
      lastActivityPlatform: 'Plateforme Web'
    });

    // Reset and close modal
    setNewUserName('');
    setNewUserEmail('');
    setNewUserAccountType('Standard');
    setNewUserKyc('PENDING');
    setShowAddModal(false);
  };

  const getKycBadge = (status: User['kycStatus']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-sans font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Vérifié
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-sans font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
            En attente
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 font-sans font-bold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            Rejeté
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Create User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#dec1af]/30 overflow-hidden transform transition-all">
            <div className="p-6 border-b border-[#dec1af]/25 flex justify-between items-center bg-[#f8f9ff]">
              <h3 className="font-sans font-bold text-[18px] text-[#0b1c30] flex items-center gap-2">
                <UserPlus className="text-[#ff8200] w-5 h-5" />
                Créer un Nouveau Compte Client
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[#574235] hover:bg-gray-100 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 font-sans text-[14px]">
              <div className="space-y-1.5">
                <label className="block font-bold text-[11px] text-[#574235] uppercase">Nom complet du client</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ex: Koffi Kouamé Arnaud"
                  className="w-full border border-[#dec1af]/45 rounded-lg px-3 py-2 text-[#0b1c30] focus:ring-1 focus:ring-[#ff8200] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-[11px] text-[#574235] uppercase">Adresse Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="Ex: arnaud.koffi@finance.ci"
                  className="w-full border border-[#dec1af]/45 rounded-lg px-3 py-2 text-[#0b1c30] focus:ring-1 focus:ring-[#ff8200] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-[11px] text-[#574235] uppercase">Type de Compte</label>
                  <select
                    value={newUserAccountType}
                    onChange={(e) => setNewUserAccountType(e.target.value as any)}
                    className="w-full bg-white border border-[#dec1af]/45 rounded-lg px-3 py-2 text-[#0b1c30] focus:ring-1 focus:ring-[#ff8200] outline-none"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-[11px] text-[#574235] uppercase">Statut KYC</label>
                  <select
                    value={newUserKyc}
                    onChange={(e) => setNewUserKyc(e.target.value as any)}
                    className="w-full bg-white border border-[#dec1af]/45 rounded-lg px-3 py-2 text-[#0b1c30] focus:ring-1 focus:ring-[#ff8200] outline-none"
                  >
                    <option value="PENDING">En attente</option>
                    <option value="VERIFIED">Vérifié</option>
                    <option value="REJECTED">Rejeté</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#dec1af]/20 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-[#574235] hover:bg-gray-100 rounded-lg font-semibold text-[13px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#ff8200] text-white rounded-lg font-bold text-[13px] hover:opacity-90 active:scale-95 transition-all shadow-sm"
                >
                  Ajouter le client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-sans font-extrabold text-[24px] text-[#0b1c30] tracking-tight">
            Gestion des Utilisateurs
          </h2>
          <p className="font-sans text-[14px] text-[#574235]/80 mt-0.5">
            Gérez les comptes clients, vérifiez les statuts KYC et surveillez l'activité.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-[#ff8200] text-white px-6 py-2.5 rounded-lg font-sans font-bold text-[13px] flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Nouveau Client
        </button>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#dec1af]/30 flex justify-between items-center group hover:border-[#ff8200] transition-colors duration-200">
          <div>
            <p className="font-sans font-bold text-[11px] text-[#574235]/70 uppercase tracking-wider mb-2">Total Utilisateurs</p>
            <h3 className="font-sans font-black text-[26px] text-[#0b1c30]">{users.length}</h3>
            <p className="text-[#574235]/70 font-sans font-medium text-[11px] mt-1">
              comptes actifs
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#f8f9ff] flex items-center justify-center text-[#ff8200] group-hover:bg-[#ffdcc6]/30 transition-colors">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#dec1af]/30 flex justify-between items-center group hover:border-[#ff8200] transition-colors duration-200">
          <div>
            <p className="font-sans font-bold text-[11px] text-[#574235]/70 uppercase tracking-wider mb-2">Attente Vérification</p>
            <h3 className="font-sans font-black text-[26px] text-[#ff8200]">
              {users.filter(u => u.kycStatus === 'PENDING').length}
            </h3>
            <p className="text-[#574235]/70 font-sans font-medium text-[11px] mt-1">
              {users.filter(u => u.kycStatus === 'PENDING').length} dossier(s) en attente
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#ffdcc6]/20 flex items-center justify-center text-[#ff8200] group-hover:bg-[#ff8200] group-hover:text-white transition-all duration-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#dec1af]/30 flex justify-between items-center group hover:border-[#ff8200] transition-colors duration-200">
          <div>
            <p className="font-sans font-bold text-[11px] text-[#574235]/70 uppercase tracking-wider mb-2">Nouveaux ce mois</p>
            <h3 className="font-sans font-black text-[26px] text-[#0b1c30]">{users.length}</h3>
            <p className="text-[#574235]/70 font-sans font-medium text-[11px] mt-1">
              nouveaux enregistrements
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#f8f9ff] flex items-center justify-center text-[#005db6] group-hover:bg-[#d6e3ff] transition-all">
            <UserPlus className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-[#dec1af]/30 rounded-t-xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[280px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#574235]/50" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[#dec1af]/40 rounded-lg text-[13px] font-sans text-[#0b1c30] focus:border-[#ff8200] focus:ring-1 focus:ring-[#ff8200] outline-none bg-white transition-all"
            placeholder="Rechercher par nom, ID ou email..."
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={kycFilter}
            onChange={(e) => setKycFilter(e.target.value)}
            className="px-4 py-2 border border-[#dec1af]/40 rounded-lg text-[13px] font-sans text-[#0b1c30] bg-white focus:ring-1 focus:ring-[#ff8200] outline-none min-w-[160px]"
          >
            <option value="">Statut KYC</option>
            <option value="VERIFIED">Vérifié</option>
            <option value="PENDING">En attente</option>
            <option value="REJECTED">Rejeté</option>
          </select>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-4 py-2 border border-[#dec1af]/40 rounded-lg text-[13px] font-sans text-[#0b1c30] bg-white focus:ring-1 focus:ring-[#ff8200] outline-none min-w-[160px]"
          >
            <option value="">Type de Compte</option>
            <option value="Premium">Premium</option>
            <option value="Standard">Standard</option>
          </select>

          <button className="flex items-center gap-2 px-4 py-2 text-[#574235]/80 hover:text-[#ff8200] transition-colors font-sans font-bold text-[13px] border border-[#dec1af]/40 rounded-lg hover:bg-[#f8f9ff]">
            <SlidersHorizontal className="w-4 h-4" />
            Filtres Avancés
          </button>

          <button 
            onClick={() => { setSearchTerm(''); setKycFilter(''); setAccountFilter(''); }}
            className="p-2 text-[#574235]/60 hover:bg-[#f8f9ff] rounded-lg transition-colors border border-transparent hover:border-[#dec1af]/30"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Client Grid / Data Table */}
      <div className="bg-white border-x border-b border-[#dec1af]/30 rounded-b-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-16 text-center text-[#574235]/60 font-sans">
              <Users className="w-12 h-12 text-[#ff8200]/50 mx-auto mb-3" />
              <p className="font-bold">Aucun client trouvé</p>
              <p className="text-[12px] mt-1">Ajustez vos filtres ou ajoutez un nouveau client.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9ff] text-[#574235] font-sans font-bold text-[11px] uppercase tracking-wider border-b border-[#dec1af]/25">
                  <th className="px-6 py-3.5">Client & ID</th>
                  <th className="px-6 py-3.5">Type de Compte</th>
                  <th className="px-6 py-3.5">Statut KYC</th>
                  <th className="px-6 py-3.5 text-right">Solde Cash</th>
                  <th className="px-6 py-3.5">Dernière Activité</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dec1af]/20">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f8f9ff]/50 transition-colors group">
                    {/* Name/Avatar Cell */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#dec1af]/30"
                        />
                        <div>
                          <p className="font-sans font-bold text-[14px] text-[#0b1c30] group-hover:text-[#954a00] transition-colors leading-tight">
                            {user.name}
                          </p>
                          <p className="font-sans text-[11px] text-[#574235]/65 mt-0.5">
                            ID: {user.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Account Type with gold star/standard icon */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.accountType === 'Premium' ? (
                          <div className="flex items-center gap-1.5 text-[#954a00]">
                            <Award className="w-4 h-4 text-[#ff8200]" />
                            <span className="font-sans font-bold text-[13px]">Premium</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#574235]/80">
                            <Users className="w-4 h-4 text-[#574235]/60" />
                            <span className="font-sans font-semibold text-[13px]">Standard</span>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* KYC Badge Column */}
                    <td className="px-6 py-4">
                      {getKycBadge(user.kycStatus)}
                    </td>
                    {/* Available Cash Balance */}
                    <td className="px-6 py-4 text-right font-sans font-extrabold text-[14px] text-[#006d31]">
                      {new Intl.NumberFormat('fr-FR').format(user.balance || 0)} FCFA
                    </td>
                    {/* Last Activity metadata */}
                    <td className="px-6 py-4">
                      <p className="font-sans text-[13px] text-[#0b1c30] font-medium">
                        {user.lastActivityDate}
                      </p>
                      <p className="font-sans text-[11px] text-[#574235]/70 mt-0.5">
                        {user.lastActivityPlatform}
                      </p>
                    </td>
                    {/* Action trigger button */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {user.kycStatus === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => onUpdateKyc(user.id, 'VERIFIED')}
                              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-sans font-bold text-[11px] rounded-lg transition-all active:scale-95 shadow-xs"
                            >
                              Valider KYC
                            </button>
                            <button 
                              onClick={() => onUpdateKyc(user.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-sans font-bold text-[11px] rounded-lg transition-all active:scale-95 shadow-xs"
                            >
                              Rejeter
                            </button>
                          </>
                        )}
                        {user.kycStatus === 'VERIFIED' && (
                          <button 
                            onClick={() => onToggleSuspend(user.id)}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-sans font-bold text-[11px] rounded-lg transition-all active:scale-95 shadow-xs"
                          >
                            Suspendre
                          </button>
                        )}
                        {user.kycStatus === 'REJECTED' && (
                          <button 
                            onClick={() => onToggleSuspend(user.id)}
                            className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-sans font-bold text-[11px] rounded-lg transition-all active:scale-95 shadow-xs"
                          >
                            Réactiver
                          </button>
                        )}
                        {user.whatsapp && user.whatsapp !== 'Non renseigné' && (
                          <button
                            onClick={() => {
                              const cleanNum = user.whatsapp.replace(/[^0-9]/g, '');
                              const message = encodeURIComponent(`Bonjour ${user.name}, je suis M. Cissé l'administrateur de BAOU Finance concernant votre ouverture de compte SGI.`);
                              window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-[11px] rounded-lg transition-all active:scale-95 shadow-xs flex items-center gap-1"
                            title="Envoyer un message WhatsApp au client"
                          >
                            💬 WhatsApp
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedUserForDetails(user)}
                          className="px-3 py-1 bg-[#eff4ff] hover:bg-[#ffdcc6]/40 text-[#954a00] font-sans font-bold text-[12px] rounded-lg transition-all active:scale-95 shadow-xs"
                        >
                          Détails Dossier SGI
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="bg-[#f8f9ff] p-4 flex flex-col sm:flex-row justify-between items-center text-[12px] text-[#574235]/80 font-sans font-medium border-t border-[#dec1af]/20 gap-4">
          <p>
            Affichage de 1 à {filteredUsers.length} utilisateurs
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-[#dec1af]/30 rounded-lg hover:bg-white text-[#574235]/60 disabled:opacity-50" disabled>
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <button className="w-8 h-8 rounded-lg bg-[#ff8200] text-white font-sans font-bold text-[12px]">1</button>
            <button className="p-2 border border-[#dec1af]/30 rounded-lg hover:bg-white text-[#574235]/60">
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SGI Dossier Inspection Modal for Admin */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 bg-[#0b1c30]/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-[#dec1af]/30 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#dec1af]/25 flex justify-between items-center bg-[#f8f9ff]">
              <div>
                <h3 className="font-sans font-bold text-[18px] text-[#0b1c30] flex items-center gap-2">
                  <ShieldCheck className="text-[#ff8200] w-5 h-5" />
                  Dossier d'Ouverture de Compte SGI — {selectedUserForDetails.name}
                </h3>
                <p className="font-sans text-[12px] text-[#574235]/70 mt-0.5">
                  ID Client: {selectedUserForDetails.id} · Inscription: {selectedUserForDetails.lastActivityDate}
                </p>
              </div>
              <button 
                onClick={() => setSelectedUserForDetails(null)}
                className="text-[#574235] hover:bg-gray-100 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 font-sans text-[13px]">
              
              {/* Section 1: Informations Personnelles & État Civil */}
              <div className="bg-[#f8f9ff] p-4 rounded-xl border border-[#dec1af]/25 space-y-3">
                <h4 className="font-bold text-[12px] text-[#ff8200] uppercase tracking-wider">
                  1. État Civil & Contact Client
                </h4>
                <div className="grid grid-cols-2 gap-4 text-[#0b1c30]">
                  <div>
                    <span className="text-[#574235]/70 text-[11px] block font-semibold">Nom Complet</span>
                    <span className="font-bold text-[14px]">{selectedUserForDetails.name}</span>
                  </div>
                  <div>
                    <span className="text-[#574235]/70 text-[11px] block font-semibold">Adresse Email</span>
                    <span className="font-semibold">{selectedUserForDetails.email}</span>
                  </div>
                  <div>
                    <span className="text-[#574235]/70 text-[11px] block font-semibold">Date de Naissance</span>
                    <span className="font-medium">{selectedUserForDetails.birthDate || 'Non spécifiée'}</span>
                  </div>
                  <div>
                    <span className="text-[#574235]/70 text-[11px] block font-semibold">Profession / Secteur</span>
                    <span className="font-medium">{selectedUserForDetails.profession || 'Non renseignée'}</span>
                  </div>
                  <div>
                    <span className="text-[#574235]/70 text-[11px] block font-semibold">Ville & Pays de Résidence</span>
                    <span className="font-medium">{selectedUserForDetails.residence || 'Abidjan, Côte d\'Ivoire'}</span>
                  </div>
                  <div>
                    <span className="text-[#574235]/70 text-[11px] block font-semibold">Numéro WhatsApp</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-emerald-700">{selectedUserForDetails.whatsapp || 'Non renseigné'}</span>
                      {selectedUserForDetails.whatsapp && selectedUserForDetails.whatsapp !== 'Non renseigné' && (
                        <button
                          onClick={() => {
                            const cleanNum = selectedUserForDetails.whatsapp.replace(/[^0-9]/g, '');
                            const message = encodeURIComponent(`Bonjour ${selectedUserForDetails.name}, je suis M. Cissé l'administrateur de BAOU Finance concernant votre dossier d'ouverture de compte SGI.`);
                            window.open(`https://wa.me/${cleanNum}?text=${message}`, '_blank');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all flex items-center gap-1"
                        >
                          💬 Contacter sur WhatsApp
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Pièces du Dossier SGI à Vérifier */}
              <div className="space-y-3">
                <h4 className="font-bold text-[12px] text-[#0b1c30] uppercase tracking-wider">
                  2. Pièces Justificatives du Dossier SGI BRVM (Lecture & Consultation)
                </h4>
                <div className="space-y-2.5">
                  {/* 1. CNI RECTO */}
                  <div className="flex items-center justify-between p-3 border border-[#dec1af]/30 rounded-xl bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        🪪
                      </div>
                      <div>
                        <p className="font-bold text-[#0b1c30]">Pièce d'Identité (RECTO)</p>
                        <p className="text-[11px] text-[#574235]/70">CNI / Passeport officiel scanné en HD</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewDocument({
                          title: `CNI (RECTO) — ${selectedUserForDetails.name}`,
                          type: 'IMAGE',
                          imageUrl: selectedUserForDetails.cniRectoUrl,
                          subtitle: 'Scan HD de la pièce d\'identité (Recto)',
                          contentText: `REPUBLIQUE DE COTE D'IVOIRE\nCARTE NATIONALE D'IDENTITE (RECTO)\nNom: ${selectedUserForDetails.name}\nProfession: ${selectedUserForDetails.profession || 'Investisseur'}\nRésidence: ${selectedUserForDetails.residence || 'Abidjan'}\nStatut: Conforme & Validé AMF-UMOA`
                        })}
                        className="px-3 py-1.5 bg-[#eff4ff] hover:bg-[#ff8200] hover:text-white text-[#ff8200] font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Voir la Photo
                      </button>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full">
                        {selectedUserForDetails.identityDocStatus || 'Présent ✅'}
                      </span>
                    </div>
                  </div>

                  {/* 2. CNI VERSO */}
                  <div className="flex items-center justify-between p-3 border border-[#dec1af]/30 rounded-xl bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        🪪
                      </div>
                      <div>
                        <p className="font-bold text-[#0b1c30]">Pièce d'Identité (VERSO)</p>
                        <p className="text-[11px] text-[#574235]/70">Au verso de la carte nationale d'identité</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewDocument({
                          title: `CNI (VERSO) — ${selectedUserForDetails.name}`,
                          type: 'IMAGE',
                          imageUrl: selectedUserForDetails.cniVersoUrl,
                          subtitle: 'Scan HD de la pièce d\'identité (Verso)',
                          contentText: `REPUBLIQUE DE COTE D'IVOIRE\nCARTE NATIONALE D'IDENTITE (VERSO)\nNom: ${selectedUserForDetails.name}\nDate d'émission: 2024\nAutorité: ONECI Côte d'Ivoire`
                        })}
                        className="px-3 py-1.5 bg-[#eff4ff] hover:bg-[#ff8200] hover:text-white text-[#ff8200] font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Voir la Photo
                      </button>
                    </div>
                  </div>

                  {/* 3. SELFIE VISAGE */}
                  <div className="flex items-center justify-between p-3 border border-[#dec1af]/30 rounded-xl bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        🤳
                      </div>
                      <div>
                        <p className="font-bold text-[#0b1c30]">Reconnaissance Faciale (Selfie Visage)</p>
                        <p className="text-[11px] text-[#574235]/70">Photo en direct capturée par le client</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewDocument({
                          title: `Selfie Visage — ${selectedUserForDetails.name}`,
                          type: 'IMAGE',
                          imageUrl: selectedUserForDetails.selfieUrl,
                          subtitle: 'Photo temps réel pour comparaison biométrique',
                          contentText: `RECONNAISSANCE FACIALE (SELFIE)\nClient: ${selectedUserForDetails.name}\nWhatsApp: ${selectedUserForDetails.whatsapp || '-'}\nHorodatage: Certifié conforme SGI BRVM`
                        })}
                        className="px-3 py-1.5 bg-[#eff4ff] hover:bg-[#ff8200] hover:text-white text-[#ff8200] font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Voir le Selfie
                      </button>
                    </div>
                  </div>

                  {/* 4. JUSTIFICATIF DOMICILE */}
                  <div className="flex items-center justify-between p-3 border border-[#dec1af]/30 rounded-xl bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        🏡
                      </div>
                      <div>
                        <p className="font-bold text-[#0b1c30]">Justificatif de Domicile (Facture CIE / SODECI)</p>
                        <p className="text-[11px] text-[#574235]/70">Moins de 3 mois · Certifié conforme par la SGI</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewDocument({
                          title: `Justificatif de Domicile CIE/SODECI — ${selectedUserForDetails.name}`,
                          type: 'PDF',
                          imageUrl: selectedUserForDetails.proofAddressUrl,
                          subtitle: 'Facture d\'électricité / eau certifiée récente',
                          contentText: `COMPAGNIE IVOIRIENNE D'ELECTRICITE (CIE)\nFACTURE D'ABONNEMENT ELECTRICITE\nTitulaire: ${selectedUserForDetails.name}\nAdresse de distribution: ${selectedUserForDetails.residence || 'Abidjan, Côte d\'Ivoire'}\nMontant: 42.500 FCFA · Statut de règlement: PAYÉ\nHorodatage: Certifié conforme SGI BRVM`
                        })}
                        className="px-3 py-1.5 bg-[#eff4ff] hover:bg-[#ff8200] hover:text-white text-[#ff8200] font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Lire le Fichier
                      </button>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full">
                        {selectedUserForDetails.proofOfAddressStatus || 'Présent ✅'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-[#dec1af]/30 rounded-xl bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        ✍️
                      </div>
                      <div>
                        <p className="font-bold text-[#0b1c30]">Contrat SGI BRVM & Signature Numérique</p>
                        <p className="text-[11px] text-[#574235]/70">Signé électroniquement (Horodatage conforme AMF-UMOA)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewDocument({
                          title: `Contrat d'Ouverture de Compte SGI — ${selectedUserForDetails.name}`,
                          type: 'PDF',
                          imageUrl: selectedUserForDetails.contractUrl,
                          subtitle: 'Contrat d\'ouverture de compte titres signé à distance',
                          contentText: `CONTRAT D'OUVERTURE DE COMPTE TITRES SGI BRVM\n====================================================\nEntre la Société de Gestion et d'Intermédiation (SGI) et :\nInvestisseur: ${selectedUserForDetails.name}\nEmail: ${selectedUserForDetails.email}\nWhatsApp: ${selectedUserForDetails.whatsapp || 'Non renseigné'}\n\nTermes & Conditions:\n1. L'investisseur donne mandat à la SGI pour l'exécution d'ordres sur la BRVM.\n2. Compte SGI exempt de frais de tenue de compte bancaire.\n\nSIGNATURE ELECTRONIQUE :\nHorodatage AMF-UMOA : VERIFIE & SECURISE ✅`
                        })}
                        className="px-3 py-1.5 bg-[#eff4ff] hover:bg-[#ff8200] hover:text-white text-[#ff8200] font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Lire le Contrat
                      </button>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full">
                        {selectedUserForDetails.signatureStatus || 'Signé ✅'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-[#dec1af]/20 rounded-xl bg-gray-50 opacity-70">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center font-bold">
                        💳
                      </div>
                      <div>
                        <p className="font-bold text-gray-700">Coordonnées Bancaires (RIB)</p>
                        <p className="text-[11px] text-gray-500">Exclu du dossier (Conforme aux spécifications)</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-gray-200 text-gray-700 font-bold text-[11px] rounded-full">
                      Non Requis
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Messagerie & Contact Direct avec le Client */}
              <div className="p-4 bg-[#eff4ff]/60 border border-[#dec1af]/30 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-[13px] text-[#0b1c30] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#ff8200]" />
                    Envoyer un Message Direct au Client
                  </h4>
                  {selectedUserForDetails.whatsapp && (
                    <button
                      onClick={() => {
                        const cleanPhone = (selectedUserForDetails.whatsapp || '').replace(/[^0-9]/g, '');
                        window.open(`https://wa.me/${cleanPhone}?text=Bonjour%20${encodeURIComponent(selectedUserForDetails.name)},%20concernant%20votre%20compte%20BAOU%20Finance...`, '_blank');
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Ouvrir WhatsApp
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminMessageInput}
                    onChange={(e) => setAdminMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendAdminMessage();
                    }}
                    placeholder={`Écrire un message à ${selectedUserForDetails.name}...`}
                    className="flex-1 bg-white border border-[#dec1af]/45 rounded-xl px-3.5 py-2 text-[13px] text-[#0b1c30] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#ff8200]"
                  />
                  <button
                    onClick={handleSendAdminMessage}
                    className="px-4 py-2 bg-[#ff8200] hover:bg-[#e67400] text-white font-bold text-[12px] rounded-xl transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    Envoyer
                  </button>
                </div>
              </div>

              {/* Section 3: Statut Actuel & Décision Admin */}
              <div className="pt-4 border-t border-[#dec1af]/25 flex items-center justify-between">
                <div>
                  <span className="text-[#574235]/70 text-[11px] block">Statut Actuel du Client</span>
                  {getKycBadge(selectedUserForDetails.kycStatus)}
                </div>
                
                <div className="flex items-center gap-3">
                  {selectedUserForDetails.kycStatus === 'PENDING' && (
                    <>
                      <button
                        onClick={() => {
                          onUpdateKyc(selectedUserForDetails.id, 'REJECTED');
                          setSelectedUserForDetails(null);
                        }}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold text-[12px] rounded-xl transition-all"
                      >
                        Rejeter le Dossier
                      </button>
                      <button
                        onClick={() => {
                          onUpdateKyc(selectedUserForDetails.id, 'VERIFIED');
                          setSelectedUserForDetails(null);
                        }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12px] rounded-xl shadow-md transition-all"
                      >
                        Valider & Activer le Compte
                      </button>
                    </>
                  )}
                  {selectedUserForDetails.kycStatus === 'VERIFIED' && (
                    <button
                      onClick={() => {
                        onToggleSuspend(selectedUserForDetails.id);
                        setSelectedUserForDetails(null);
                      }}
                      className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[12px] rounded-xl transition-all"
                    >
                      Suspendre le Compte
                    </button>
                  )}
                  {selectedUserForDetails.kycStatus === 'REJECTED' && (
                    <button
                      onClick={() => {
                        onToggleSuspend(selectedUserForDetails.id);
                        setSelectedUserForDetails(null);
                      }}
                      className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[12px] rounded-xl transition-all"
                    >
                      Réactiver le Compte
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Document & Photo Reader Reader Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-[#0b1c30] rounded-2xl w-full max-w-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Document Reader Header */}
            <div className="p-4 bg-white/10 border-b border-white/15 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff8200] flex items-center justify-center text-white font-bold">
                  {previewDocument.type === 'IMAGE' ? <Eye className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-white">{previewDocument.title}</h3>
                  <p className="text-[11px] text-white/70">{previewDocument.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const cleanName = previewDocument.title.replace(/[^a-zA-Z0-9_-]/g, '_');
                    if (previewDocument.imageUrl) {
                      const link = document.createElement('a');
                      link.href = previewDocument.imageUrl;
                      link.download = `${cleanName}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } else {
                      const textContent = `${previewDocument.title}\n${'='.repeat(50)}\n${previewDocument.contentText || ''}\n${'='.repeat(50)}\nDate de téléchargement: ${new Date().toLocaleString('fr-FR')}`;
                      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${cleanName}.txt`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#ff8200] hover:bg-[#e67400] text-white font-bold text-[12px] rounded-lg transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  Télécharger sur mon PC
                </button>
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Document View Canvas Container */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-[#071322]">
              {previewDocument.imageUrl ? (
                <div className="w-full max-w-2xl bg-white/5 border border-white/10 p-4 rounded-2xl text-center space-y-4 flex flex-col items-center">
                  {previewDocument.imageUrl.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={previewDocument.imageUrl}
                      title={previewDocument.title}
                      className="w-full h-[60vh] rounded-xl border border-white/20 bg-white"
                    />
                  ) : (
                    <img
                      src={previewDocument.imageUrl}
                      alt={previewDocument.title}
                      className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/20"
                    />
                  )}
                  <div className="bg-gradient-to-br from-emerald-900/40 via-[#0b1c30] to-emerald-950/40 p-4 rounded-xl border border-emerald-500/30 text-left w-full">
                    <pre className="font-mono text-[12px] text-emerald-200 whitespace-pre-wrap">
                      {previewDocument.contentText}
                    </pre>
                  </div>
                  <p className="text-[11px] text-white/50 italic">
                    Document officiel récepté · Horodaté AMF-UMOA
                  </p>
                </div>
              ) : previewDocument.type === 'IMAGE' ? (
                <div className="w-full max-w-xl bg-white/5 border border-white/10 p-6 rounded-2xl text-center space-y-4">
                  {/* Digital Document Identity Scan Card Representation */}
                  <div className="bg-gradient-to-br from-emerald-900/40 via-[#0b1c30] to-emerald-950/40 p-6 rounded-xl border border-emerald-500/30 text-left relative overflow-hidden shadow-inner">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase">REPUBLIQUE DE COTE D'IVOIRE</span>
                        <h4 className="font-bold text-white text-[16px]">CARTE NATIONALE D'IDENTITE</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] rounded border border-emerald-400/30">
                        SCAN HD VERIFIÉ
                      </span>
                    </div>

                    <div className="flex gap-4 items-center">
                      <div className="w-24 h-28 bg-emerald-950/80 border border-emerald-500/40 rounded-lg flex flex-col items-center justify-center text-center p-2">
                        <span className="text-3xl mb-1">👤</span>
                        <span className="text-[9px] text-emerald-300 font-bold">PHOTO CLIENT</span>
                      </div>
                      <div className="space-y-1.5 text-white/90 text-[12px] font-sans">
                        <pre className="font-mono text-[12px] text-emerald-200 whitespace-pre-wrap">
                          {previewDocument.contentText}
                        </pre>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 italic">
                    Scanné haute résolution · Empreinte d'authenticité horodatée AMF-UMOA
                  </p>
                </div>
              ) : (
                <div className="w-full bg-white text-gray-900 p-8 rounded-xl shadow-2xl font-serif text-[13px] leading-relaxed space-y-4 max-w-xl">
                  <div className="border-b border-gray-300 pb-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-[16px] text-[#0b1c30]">{previewDocument.title}</h4>
                      <p className="text-[11px] text-gray-500">Document PDF Officiel · Certification SGI BRVM</p>
                    </div>
                    <span className="text-emerald-700 font-bold text-[12px] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      DOCUMENT VALIDE ✅
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-[12px] text-gray-800 whitespace-pre-wrap">
                    {previewDocument.contentText}
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-500 font-sans">
                    <span>Certificat Numérique: 0x9F4B...82A1</span>
                    <span>Format: PDF / A-1b Compliant</span>
                  </div>
                </div>
              )}
            </div>

            {/* Document Reader Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center text-white/70 text-[12px]">
              <span>Affichage sécurisé Espace Admin</span>
              <button
                onClick={() => setPreviewDocument(null)}
                className="px-5 py-2 bg-[#ff8200] hover:bg-[#e67400] text-white font-bold text-[13px] rounded-xl transition-all shadow-md"
              >
                Fermer la lecture
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
