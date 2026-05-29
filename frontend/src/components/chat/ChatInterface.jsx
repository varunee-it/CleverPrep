import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Sparkles, Plus, Trash2, Menu, X, Clock, MoreVertical, Edit2, Share2, Download, FileText, Check, MessageCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import aiService from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner';
import MarkdownRenderer from '../common/MarkdownRenderer';

const ChatInterface = () => {
    const { id: documentId } = useParams();
    const { user } = useAuth();
    
    // Core state
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(() => {
        return localStorage.getItem(`active_chat_${documentId}`) || null;
    });
    const [history, setHistory] = useState([]);
    
    // UI state
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Action states
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [deletingId, setDeletingId] = useState(null);
    
    // Share Modal State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareLink, setShareLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [sharingId, setSharingId] = useState(null);

    const messagesEndRef = useRef(null);
    const editInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = () => setMenuOpenId(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingId]);

    // 1. Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setInitialLoading(true);
                const res = await aiService.getConversations(documentId);
                setConversations(res.data);
                
                if (activeConversationId && !res.data.find(c => c._id === activeConversationId)) {
                    setActiveConversationId(null);
                    localStorage.removeItem(`active_chat_${documentId}`);
                } else if (!activeConversationId && res.data.length > 0) {
                    setActiveConversationId(res.data[0]._id);
                }
            } catch (error) {
                console.error("Failed to load conversations:", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchConversations();
    }, [documentId]);

    // 2. Fetch history
    useEffect(() => {
        if (activeConversationId) {
            localStorage.setItem(`active_chat_${documentId}`, activeConversationId);
            const loadHistory = async () => {
                setLoading(true);
                try {
                    const res = await aiService.getChatHistory(activeConversationId);
                    setHistory(res.data || []);
                } catch (e) {
                    console.error(e);
                    setHistory([]);
                } finally {
                    setLoading(false);
                }
            };
            loadHistory();
        } else {
            localStorage.removeItem(`active_chat_${documentId}`);
            setHistory([]);
        }
    }, [activeConversationId, documentId]);

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    const handleNewChat = () => {
        setActiveConversationId(null);
        setHistory([]);
        if (window.innerWidth < 768) setSidebarOpen(false);
    };

    // Actions
    const handleRenameSubmit = async (convId) => {
        if (!editTitle.trim()) {
            setEditingId(null);
            return;
        }
        
        // Optimistic update
        setConversations(prev => prev.map(c => c._id === convId ? { ...c, title: editTitle } : c));
        setEditingId(null);
        
        try {
            await aiService.renameConversation(convId, editTitle);
        } catch (error) {
            console.error("Failed to rename:", error);
            // Revert on failure
            const res = await aiService.getConversations(documentId);
            setConversations(res.data);
        }
    };

    const handleDeleteChat = async (convId) => {
        if (!window.confirm('Are you sure you want to delete this conversation?')) return;
        
        setDeletingId(convId);
        setConversations(prev => prev.filter(c => c._id !== convId));
        
        try {
            await aiService.deleteConversation(convId);
            if (activeConversationId === convId) {
                setConversations(prev => {
                    if (prev.length > 0) {
                        setActiveConversationId(prev[0]._id);
                    } else {
                        setActiveConversationId(null);
                        setHistory([]);
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('Delete failed:', error);
            const res = await aiService.getConversations(documentId);
            setConversations(res.data);
        } finally {
            setDeletingId(null);
        }
    };

    const handleShare = async (convId) => {
        setSharingId(convId);
        try {
            const res = await aiService.shareConversation(convId);
            const link = `${window.location.origin}/share/${res.data.shareId}`;
            setShareLink(link);
            setShareModalOpen(true);
        } catch (error) {
            console.error("Failed to share:", error);
            alert("Failed to generate share link.");
        } finally {
            setSharingId(null);
        }
    };

    // Export Handlers
    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsAppShare = () => {
        const text = encodeURIComponent(`Check out this AI conversation: ${shareLink}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleExportTXT = () => {
        const textContent = history.map(msg => `${msg.role.toUpperCase()}:\n${msg.content}\n\n`).join('');
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-export-${new Date().getTime()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        window.print();
    };

    // Sending Messages
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || loading) return;

        const userMsgContent = message;
        setMessage('');
        
        const optimisticMsg = { role: 'user', content: userMsgContent, timestamp: new Date() };
        setHistory(prev => [...prev, optimisticMsg]);
        setLoading(true);

        try {
            const response = await aiService.chat(documentId, userMsgContent, activeConversationId);
            
            if (!activeConversationId && response.data.chatHistoryId) {
                const newId = response.data.chatHistoryId;
                setActiveConversationId(newId);
                setConversations(prev => [{
                    _id: newId,
                    title: response.data.title || "New Conversation",
                    updatedAt: new Date().toISOString()
                }, ...prev]);
            }

            const assistantMsg = {
                role: 'assistant',
                content: response.data.answer,
                timestamp: new Date(),
                relevantChunks: response.data.relevantChunks
            };
            
            setHistory(prev => [...prev, assistantMsg]);
            
            if (activeConversationId || response.data.chatHistoryId) {
                const targetId = activeConversationId || response.data.chatHistoryId;
                setConversations(prev => {
                    const existing = prev.find(c => c._id === targetId);
                    const others = prev.filter(c => c._id !== targetId);
                    if (existing) {
                        return [{...existing, updatedAt: new Date().toISOString()}, ...others];
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error('Chat error:', error);
            setHistory(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = (msg, index) => {
        const isUser = msg.role === 'user';
        return (
            <div key={index} className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
                {!isUser && (
                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0 print:hidden">
                        <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                )}
                <div className={`max-w-lg p-4 rounded-2xl shadow-sm ${
                    isUser
                    ? 'bg-linear-to-br from-emerald-500 to-teal-500 text-white rounded-br-md print:bg-slate-100 print:text-black print:border print:border-slate-300'
                    : 'bg-white border border-slate-200/60 text-slate-800 rounded-bl-md print:bg-white print:border-slate-300'
                }`}>
                    {isUser ? (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                        <div className="prose prose-sm max-w-none prose-slate">
                            <MarkdownRenderer content={msg.content} />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row h-[70vh] bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden relative">
            
            {/* Share Modal */}
            {shareModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-emerald-500" /> Share Conversation
                            </h3>
                            <button onClick={() => setShareModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <input readOnly value={shareLink} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 focus:outline-none" />
                                <button onClick={handleCopyLink} className="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors flex items-center gap-2">
                                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                                <button onClick={handleWhatsAppShare} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-green-50 hover:text-green-600 text-slate-600 transition-colors">
                                    <MessageCircle className="w-5 h-5" />
                                    <span className="text-xs font-medium">WhatsApp</span>
                                </button>
                                <button onClick={handleExportTXT} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors">
                                    <FileText className="w-5 h-5" />
                                    <span className="text-xs font-medium">TXT</span>
                                </button>
                                <button onClick={handleExportPDF} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors">
                                    <Download className="w-5 h-5" />
                                    <span className="text-xs font-medium">PDF</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Header Toggle */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200/60 bg-white/80 z-20 print:hidden">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    Chat History
                </div>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-slate-100 rounded-lg text-slate-600">
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Sidebar */}
            <div className={`absolute md:relative z-10 w-full md:w-1/3 lg:w-1/4 h-full bg-slate-50 border-r border-slate-200/60 flex flex-col transition-transform duration-300 print:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                <div className="p-4 border-b border-slate-200/60">
                    <button 
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {initialLoading ? (
                        <div className="space-y-3 p-2">
                            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-200/60 animate-pulse rounded-xl"></div>)}
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center p-4 text-sm text-slate-500 mt-4">No previous conversations</div>
                    ) : (
                        conversations.map(conv => (
                            <div 
                                key={conv._id}
                                className={`group relative rounded-xl transition-all border ${
                                    activeConversationId === conv._id 
                                    ? 'bg-white border-emerald-500/30 shadow-sm' 
                                    : 'bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200'
                                }`}
                            >
                                <div 
                                    className="p-3 cursor-pointer flex flex-col gap-1"
                                    onClick={() => { if(editingId !== conv._id) { setActiveConversationId(conv._id); if(window.innerWidth<768) setSidebarOpen(false); } }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                                            <MessageSquare className={`w-4 h-4 shrink-0 ${activeConversationId === conv._id ? 'text-emerald-500' : 'text-slate-400'}`} />
                                            {editingId === conv._id ? (
                                                <input 
                                                    ref={editInputRef}
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onBlur={() => handleRenameSubmit(conv._id)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(conv._id)}
                                                    className="flex-1 bg-white border border-emerald-300 rounded px-2 py-0.5 text-sm text-slate-700 focus:outline-none"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className="text-sm font-medium text-slate-700 truncate">{conv.title}</span>
                                            )}
                                        </div>
                                        
                                        {/* 3-Dot Menu */}
                                        <div className="relative shrink-0 flex items-center">
                                            {sharingId === conv._id ? (
                                                <Spinner size="w-4 h-4" />
                                            ) : deletingId === conv._id ? (
                                                <span className="w-4 h-4 block rounded-full border-2 border-red-500 border-t-transparent animate-spin"></span>
                                            ) : (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === conv._id ? null : conv._id); }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-opacity"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            )}
                                            
                                            {menuOpenId === conv._id && (
                                                <div className="absolute right-0 top-6 w-36 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 py-1 z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => { setEditTitle(conv.title); setEditingId(conv._id); setMenuOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-emerald-600">
                                                        <Edit2 className="w-4 h-4" /> Rename
                                                    </button>
                                                    <button onClick={() => { handleShare(conv._id); setMenuOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-blue-600">
                                                        <Share2 className="w-4 h-4" /> Share
                                                    </button>
                                                    <div className="h-px bg-slate-100 my-1"></div>
                                                    <button onClick={() => { handleDeleteChat(conv._id); setMenuOpenId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-6 text-xs text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        {new Date(conv.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white/50 h-full relative z-0 print:bg-white print:w-full print:h-auto print:block">
                <div className="flex-1 p-4 md:p-6 overflow-y-auto print:overflow-visible print:p-0">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center print:hidden">
                            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
                                <MessageSquare className="w-8 h-8 text-emerald-600" strokeWidth={2} />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 mb-2">Start a conversation</h3>
                            <p className="text-sm text-slate-500">Ask me anything about the document!</p>
                        </div>
                    ) : (
                        history.map(renderMessage)
                    )}
                    <div ref={messagesEndRef} className="print:hidden" />
                    {loading && (
                        <div className="flex items-center gap-3 my-4 print:hidden">
                            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0">
                                <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                            </div>
                            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-slate-200/60">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 md:p-5 border-t border-slate-200/60 bg-white/80 print:hidden">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Ask a follow-up question..."
                            disabled={loading}
                            className="flex-1 h-12 px-4 border-2 border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={loading || !message.trim()}
                            className="shrink-0 w-12 h-12 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center"
                        >
                            <Send className="w-5 h-5" strokeWidth={2} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;