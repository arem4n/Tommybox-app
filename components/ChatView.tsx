
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { mockChatMessages, mockUsers, addChatMessage, mockDb } from '../services/mockData';
import { GoogleGenAI } from "@google/genai";

interface ChatViewProps {
  userId: string;
  companionId: string;
  onClose: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ userId, companionId, onClose }) => {
  const sortedIds = [userId, companionId].sort();
  const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Identify who is who
  const currentUserIsTrainer = userId.includes('trainer'); // Simple check based on ID convention in mockData
  const companionUser = mockUsers.find(u => u.id === companionId);
  const companionName = companionUser?.displayName || companionUser?.username || 'Chat';

  useEffect(() => {
    // Load existing messages
    if (mockChatMessages[chatId]) {
        setMessages(mockChatMessages[chatId]);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- RAG: RETRIEVAL AUGMENTED GENERATION ---
  // If the companion is the "Trainer" (AI), we gather context about the user (userId)
  const getUserContext = () => {
      const userProfile = mockUsers.find(u => u.id === userId);
      const userData = mockDb[userId];
      
      if (!userProfile || !userData) return '';

      const recentMetrics = userData.metrics?.slice(-3).map(m => 
          `- ${m.exercise}: ${m.load}kg x ${m.reps} (RPE: ${m.rpe || 'N/A'}) el ${m.date}`
      ).join('\n') || 'Sin registros recientes.';

      const recentSessions = userData.sessions?.filter(s => new Date(s.date) > new Date()).slice(0, 2).map(s =>
          `- ${s.date} a las ${s.time}`
      ).join('\n') || 'No hay sesiones futuras agendadas.';

      const level = userProfile.gamification?.level || 1;
      const plan = userProfile.plan || 'Sin plan';

      return `
      CONTEXTO DEL ATLETA:
      - Nombre: ${userProfile.displayName || userProfile.username}
      - Nivel: ${level}
      - Plan: ${plan}
      - Últimos registros de fuerza:
      ${recentMetrics}
      - Próximas sesiones agendadas:
      ${recentSessions}
      `;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg = {
        id: `msg_${Date.now()}`,
        senderId: userId,
        text: newMessage,
        timestamp: { toDate: () => new Date() }
    };

    // Optimistic Update
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    addChatMessage(chatId, userMsg);
    setNewMessage('');

    // AI LOGIC
    // Only trigger AI if the companion is the Trainer and the user is a Client
    if (companionId === 'trainer01' && !currentUserIsTrainer) {
        setIsTyping(true);
        try {
            // RAG Injection
            const userContext = getUserContext();
            
            const systemInstruction = `
            Eres Tommy, un entrenador personal experto, motivador y conciso de la app TommyBox.
            Tu objetivo es ayudar al atleta a mejorar su rendimiento, resolver dudas sobre ejercicios y mantener la motivación alta.
            Usa emojis ocasionalmente. Sé breve.
            
            ${userContext}
            
            Responde basándote en el contexto del atleta si es relevante.
            `;

            // Initialize Gemini
            // NOTE: In a real app, do not expose API_KEY in frontend code. 
            // Use a backend proxy. For this demo, we assume process.env.API_KEY is injected by the bundler.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Construct history for Gemini
            // Map our chat structure to Gemini's content structure
            // We take the last 10 messages to save tokens
            const history = updatedMessages.slice(-10).map(m => ({
                role: m.senderId === 'trainer01' ? 'model' : 'user',
                parts: [{ text: m.text }]
            }));

            const chat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: systemInstruction,
                },
                history: history
            });

            const result = await chat.sendMessage({ message: newMessage });
            const aiResponseText = result.text;

            const aiMsg = {
                id: `msg_${Date.now() + 1}`,
                senderId: companionId,
                text: aiResponseText,
                timestamp: { toDate: () => new Date() }
            };

            setMessages(prev => [...prev, aiMsg]);
            addChatMessage(chatId, aiMsg);

        } catch (error) {
            console.error("AI Error:", error);
            // Fallback message if AI fails
            const errorMsg = {
                id: `msg_${Date.now() + 1}`,
                senderId: companionId,
                text: "Lo siento, estoy teniendo problemas de conexión en este momento. Intenta de nuevo más tarde.",
                timestamp: { toDate: () => new Date() }
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    }
  };

  return (
    <div className="fixed bottom-0 right-0 md:bottom-24 md:right-6 w-full md:w-96 h-[80vh] md:h-[600px] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-200 animate-slide-up">
      {/* Header */}
      <div className="p-4 bg-gray-900 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                {companionId === 'trainer01' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div>
                <h3 className="font-bold text-sm">{companionName}</h3>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-xs text-gray-300">En línea</span>
                </div>
            </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => {
            const isMe = msg.senderId === userId;
            return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
                        isMe 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}>
                        {msg.text}
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                            {new Date(typeof msg.timestamp.toDate === 'function' ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                </div>
            );
        })}
        {isTyping && (
             <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl p-3 rounded-bl-none shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400">Tommy está escribiendo...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 shrink-0">
        <div className="flex gap-2">
            <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..." 
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button 
                type="submit" 
                disabled={!newMessage.trim() || isTyping}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            >
                <Send size={20} />
            </button>
        </div>
      </form>
    </div>
  );
};

export default ChatView;
