import React, { useState, useEffect } from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';
import aiService from '../services/aiService';
import Spinner from '../components/common/Spinner';
import MarkdownRenderer from '../components/common/MarkdownRenderer';

const SharedChatPage = () => {
    const { shareId } = useParams();
    const [history, setHistory] = useState([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSharedChat = async () => {
            try {
                setLoading(true);
                const res = await aiService.getSharedConversation(shareId);
                setHistory(res.data.messages || []);
                setTitle(res.data.title || "Shared Conversation");
            } catch (err) {
                console.error(err);
                setError("This conversation doesn't exist or is no longer public.");
            } finally {
                setLoading(false);
            }
        };
        fetchSharedChat();
    }, [shareId]);

    const renderMessage = (msg, index) => {
        const isUser = msg.role === 'user';
        return (
            <div key={index} className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
                {!isUser && (
                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                )}
                <div className={`max-w-lg p-4 rounded-2xl shadow-sm ${
                    isUser
                    ? 'bg-linear-to-br from-emerald-500 to-teal-500 text-white rounded-br-md'
                    : 'bg-white border border-slate-200/60 text-slate-800 rounded-bl-md'
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

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50">
                    <Spinner />
                    <p className="text-slate-500 font-medium">Loading conversation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4 text-red-500">
                    <MessageSquare size={32} />
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">Conversation Not Found</h1>
                <p className="text-slate-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto flex flex-col h-[85vh] bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-200/60 bg-white/80 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-inner">
                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                            <p className="text-xs text-slate-500">Shared Conversation • Read Only</p>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-6 overflow-y-auto bg-linear-to-br from-slate-50/50 via-white/50 to-slate-50/50">
                    {history.length === 0 ? (
                        <div className="text-center text-slate-500 mt-10">No messages in this conversation.</div>
                    ) : (
                        history.map(renderMessage)
                    )}
                </div>
            </div>
        </div>
    );
};

export default SharedChatPage;
