import React, { useState } from 'react';
import { SupportTicket } from '../types';
import { 
  HelpCircle, 
  Search, 
  Send, 
  CheckCircle2, 
} from 'lucide-react';

interface SupportViewProps {
  tickets: SupportTicket[];
  onUpdateTicketStatus: (id: string, status: SupportTicket['status']) => void;
}

export const SupportView: React.FC<SupportViewProps> = ({
  tickets,
  onUpdateTicketStatus
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OUVERT' | 'EN_COURS' | 'RESOLU'>('ALL');
  
  // Chat messaging mock state
  const [replyText, setReplyText] = useState('');
  const [ticketMessages, setTicketMessages] = useState<Record<string, { sender: 'ADMIN' | 'CLIENT'; text: string; time: string }[]>>({
    '#T-9021': [
      { sender: 'CLIENT', text: 'J\'ai effectué un dépôt via Orange Money de 150 000 FCFA il y a plus de 2 heures, mais mon solde n\'est toujours pas mis à jour.', time: '09:45' }
    ],
    '#T-1142': [
      { sender: 'CLIENT', text: 'Mes justificatifs de domicile ont été rejetés deux fois de suite. Pouvez-vous m\'indiquer quels formats de documents sont acceptés ?', time: 'Hier, 14:20' },
      { sender: 'ADMIN', text: 'Bonjour Awa, nous acceptons uniquement les factures d\'électricité (CIE), d\'eau (SODECI) ou les certificats de résidence datant de moins de 3 mois au format PDF ou JPEG lisible.', time: 'Hier, 15:05' },
      { sender: 'CLIENT', text: 'D\'accord, je vais uploader ma facture d\'électricité de ce mois alors. Merci pour l\'information rapide.', time: 'Hier, 15:12' }
    ]
  });

  const activeTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0];

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' ? true : t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || !activeTicket) return;

    const currentMessages = ticketMessages[activeTicket.id] || [];
    const newMessages = [
      ...currentMessages,
      {
        sender: 'ADMIN',
        text: replyText,
        time: 'À l\'instant'
      }
    ];

    setTicketMessages({
      ...ticketMessages,
      [activeTicket.id]: newMessages
    });

    // Automatically set status to EN_COURS when admin replies!
    if (activeTicket.status === 'OUVERT') {
      onUpdateTicketStatus(activeTicket.id, 'EN_COURS');
    }

    setReplyText('');
  };

  const handleMarkResolved = () => {
    if (activeTicket) {
      onUpdateTicketStatus(activeTicket.id, 'RESOLU');
    }
  };

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'HAUTE':
        return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-sans font-bold text-[10px]">HAUTE</span>;
      case 'MOYENNE':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-sans font-bold text-[10px]">MOYENNE</span>;
      case 'BASSE':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-sans font-bold text-[10px]">BASSE</span>;
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'OUVERT':
        return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-sans font-bold text-[10px] uppercase">Ouvert</span>;
      case 'EN_COURS':
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-sans font-bold text-[10px] uppercase">En cours</span>;
      case 'RESOLU':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-sans font-bold text-[10px] uppercase">Résolu</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header */}
      <div>
        <h2 className="font-sans font-extrabold text-[24px] text-[#0b1c30] tracking-tight">
          Support & Assistance Client
        </h2>
        <p className="font-sans text-[14px] text-[#574235]/80 mt-0.5">
          Traitez les réclamations de versement, répondez aux questions de validation de comptes et aidez les utilisateurs.
        </p>
      </div>

      {/* Main Support Grid splitting the sidebar ticket list and the active discussion */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        
        {/* Left column: Ticket navigation list (Span 5) */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-[#dec1af]/30 rounded-xl overflow-hidden flex flex-col h-full hover:shadow-xs transition-all">
          
          {/* Header filter tools */}
          <div className="p-4 border-b border-[#dec1af]/20 space-y-3 bg-[#f8f9ff]/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#574235]/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher ticket..."
                className="w-full bg-white border border-[#dec1af]/30 rounded-lg pl-9 pr-4 py-1.5 text-[12px] font-sans focus:outline-none focus:ring-1 focus:ring-[#ff8200] outline-none"
              />
            </div>

            <div className="flex bg-white border border-[#dec1af]/30 rounded-lg p-1 text-[11px] font-bold font-sans">
              <button 
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1 rounded text-center ${statusFilter === 'ALL' ? 'bg-[#ff8200] text-white' : 'text-[#574235] hover:text-[#954a00]'}`}
              >
                Tout
              </button>
              <button 
                onClick={() => setStatusFilter('OUVERT')}
                className={`flex-1 py-1 rounded text-center ${statusFilter === 'OUVERT' ? 'bg-[#ff8200] text-white' : 'text-[#574235] hover:text-[#954a00]'}`}
              >
                Ouvert
              </button>
              <button 
                onClick={() => setStatusFilter('EN_COURS')}
                className={`flex-1 py-1 rounded text-center ${statusFilter === 'EN_COURS' ? 'bg-[#ff8200] text-white' : 'text-[#574235] hover:text-[#954a00]'}`}
              >
                En cours
              </button>
              <button 
                onClick={() => setStatusFilter('RESOLU')}
                className={`flex-1 py-1 rounded text-center ${statusFilter === 'RESOLU' ? 'bg-[#ff8200] text-white' : 'text-[#574235] hover:text-[#954a00]'}`}
              >
                Résolu
              </button>
            </div>
          </div>

          {/* Scrolling Ticket Container list */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#dec1af]/15">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-[#574235]/60 font-sans">
                <p className="font-bold">Aucun ticket trouvé</p>
                <p className="text-[11px] mt-1">Ajustez le filtre de statut ou recherchez un autre terme.</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected ? 'bg-[#ffdcc6]/20 border-l-4 border-l-[#ff8200]' : 'hover:bg-[#f8f9ff]/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono font-bold text-[12px] text-[#ff8200]">{t.id}</span>
                      <span className="text-[11px] text-[#574235]/70 font-sans font-medium">{t.dateString}, {t.timeString}</span>
                    </div>
                    <h4 className="font-sans font-bold text-[13px] text-[#0b1c30] truncate mt-1.5">{t.subject}</h4>
                    <p className="font-sans text-[11px] text-[#574235]/80 mt-1 truncate">{t.clientName} ({t.clientId})</p>
                    <div className="flex items-center gap-2 mt-3.5">
                      {getPriorityBadge(t.priority)}
                      {getStatusBadge(t.status)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Selected Ticket chat interface (Span 7) */}
        <div className="col-span-12 lg:col-span-7 bg-white border border-[#dec1af]/30 rounded-xl overflow-hidden flex flex-col h-full hover:shadow-xs transition-all">
          {activeTicket ? (
            <div className="flex flex-col h-full">
              {/* Chat sub-header */}
              <div className="p-4 border-b border-[#dec1af]/20 bg-[#f8f9ff]/50 flex justify-between items-center shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[13px] text-[#ff8200]">{activeTicket.id}</span>
                    {getPriorityBadge(activeTicket.priority)}
                    {getStatusBadge(activeTicket.status)}
                  </div>
                  <h3 className="font-sans font-extrabold text-[15px] text-[#0b1c30] truncate mt-1">{activeTicket.subject}</h3>
                  <p className="text-[11px] text-[#574235]/80 font-sans font-semibold mt-0.5">
                    Client: {activeTicket.clientName} ({activeTicket.clientId})
                  </p>
                </div>

                {/* Mark as resolved action */}
                {activeTicket.status !== 'RESOLU' && (
                  <button
                    onClick={handleMarkResolved}
                    className="bg-[#006d31] hover:opacity-90 text-white font-sans font-bold text-[11px] px-4 py-2 rounded-lg flex items-center gap-1.5 active:scale-95 transition-all shadow-xs shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marquer Résolu
                  </button>
                )}
              </div>

              {/* Chat messages body area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                
                {/* Initial original Ticket Description Box */}
                <div className="bg-white border border-[#dec1af]/30 p-4 rounded-xl shadow-xs space-y-2">
                  <span className="font-sans font-bold text-[10px] text-[#574235]/70 uppercase tracking-wider block">Description d'assistance initiale :</span>
                  <p className="font-sans text-[13px] text-[#0b1c30] leading-relaxed">
                    {activeTicket.description}
                  </p>
                </div>

                {/* Dynamic messages chain */}
                {(ticketMessages[activeTicket.id] || []).map((msg, idx) => {
                  const isAdmin = msg.sender === 'ADMIN';
                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col max-w-[80%] ${isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className={`p-3 rounded-2xl text-[13px] font-sans shadow-xs ${
                        isAdmin 
                          ? 'bg-[#ff8200] text-white rounded-tr-none' 
                          : 'bg-white border border-[#dec1af]/20 text-[#0b1c30] rounded-tl-none'
                      }`}>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-[#574235]/60 font-sans font-medium mt-1 px-1">{msg.time}</span>
                    </div>
                  );
                })}
              </div>

              {/* Message Input Box footer */}
              {activeTicket.status !== 'RESOLU' ? (
                <form onSubmit={handleSendMessage} className="p-3 border-t border-[#dec1af]/20 bg-white flex items-center gap-3 shrink-0">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrire une réponse d'assistance..."
                    className="flex-1 bg-[#f8f9ff] border border-[#dec1af]/35 rounded-lg px-4 py-2.5 text-[13px] font-sans text-[#0b1c30] focus:ring-1 focus:ring-[#ff8200] outline-none"
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 bg-[#ff8200] hover:bg-[#ff8200]/95 text-white rounded-lg flex items-center justify-center shrink-0 hover:opacity-95 active:scale-95 transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-emerald-50 border-t border-[#dec1af]/15 text-center text-emerald-800 font-sans font-bold text-[12px] shrink-0">
                  Ce ticket d'assistance a été marqué comme résolu par l'administration d'Éléphant Bourse.
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-[#574235]/65 font-sans">
              <HelpCircle className="w-12 h-12 text-[#dec1af] mb-2" />
              <p className="font-bold">Sélectionnez un ticket pour entamer la résolution</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
