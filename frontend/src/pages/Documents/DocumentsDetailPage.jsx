import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import documentService from '../../services/documentService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { ArrowLeft, ExternalLink, MessageSquare, Wand2, BookOpen, BrainCircuit, Columns, SidebarClose, LayoutPanelLeft, Headphones } from 'lucide-react';
import ChatInterface from '../../components/chat/ChatInterface';
import AIActions from '../../components/ai/AIActions';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { BASE_URL } from '../../utils/apiPaths';
import FlashcardManager from '../../components/flashcards/FlashcardManager';
import QuizManager from '../../components/quizzes/QuizManager';
import PodcastManager from '../../components/podcast/PodcastManager';

const DocumentDetailPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  const getInitialTab = () => {
    const queryParams = new URLSearchParams(window.location.search);
    const tab = queryParams.get('tab');
    return tab || 'Content';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const tab = queryParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [window.location.search]);

  useEffect(() => {
    const fetchDocumentDetails = async () => {
      try {
        const data = await documentService.getDocumentById(id);
        setDocument(data);
      } catch (error) {
        toast.error('Failed to fetch document details.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentDetails();
  }, [id]);

  const getPdfUrl = () => {
    if (!document?.data?.filePath) return null;
    const filePath = document.data.filePath;
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    return `${BASE_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  };

  if (loading) {
    return <div className="h-[60vh] flex items-center justify-center"><Spinner /></div>;
  }

  if (!document || !document.data) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 mb-4">Document not found or unavailable.</p>
        <Link to="/documents" className="text-emerald-600 font-medium hover:text-emerald-700">
          Return to Library
        </Link>
      </div>
    );
  }

  const pdfUrl = getPdfUrl();

  const tabs = [
    { id: 'Content', icon: BookOpen, label: 'Read' },
    { id: 'Chat', icon: MessageSquare, label: 'AI Tutor' },
    { id: 'Flashcards', icon: BrainCircuit, label: 'Flashcards' },
    { id: 'Quizzes', icon: LayoutPanelLeft, label: 'Quiz' },
    { id: 'Podcast', icon: Headphones, label: 'Podcast' },
    { id: 'Summary', icon: Wand2, label: 'Notes' },
  ];

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      {/* Workspace Header */}
      <div className="flex-none bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link to="/documents" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3 overflow-hidden">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {document.data.title}
            </h1>
          </div>
        </div>

        <div className="hidden md:flex items-center px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600">
           Study Workspace
        </div>

        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm ml-4"
          >
            <ExternalLink size={16} /> <span className="hidden sm:inline">Open External</span>
          </a>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex-none bg-white border-b border-slate-200 px-4 sm:px-6 pt-3">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-3">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <tab.icon size={18} className={isActive ? "text-emerald-600" : "text-slate-400"} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
        
        {/* Content Tab (Full Width PDF) */}
        {activeTab === 'Content' && (
          <div className="flex-1 w-full h-full relative">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="absolute inset-0 w-full h-full border-none"
                title="Document Reader"
                frameBorder="0"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center h-full">
                <p className="text-slate-500">No PDF available for reading.</p>
              </div>
            )}
          </div>
        )}

        {/* Other Study Tools */}
        {activeTab !== 'Content' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
            <div className="h-full w-full max-w-5xl mx-auto">
              {activeTab === 'Chat' && <ChatInterface />}
              {activeTab === 'Summary' && (
                <ErrorBoundary>
                  <AIActions />
                </ErrorBoundary>
              )}
              {activeTab === 'Flashcards' && (
                <ErrorBoundary>
                  <FlashcardManager documentId={id} onTabChange={setActiveTab} />
                </ErrorBoundary>
              )}
              {activeTab === 'Quizzes' && (
                <ErrorBoundary>
                  <QuizManager documentId={id} />
                </ErrorBoundary>
              )}
              {activeTab === 'Podcast' && (
                <ErrorBoundary>
                  <PodcastManager documentId={id} documentTitle={document.data.title} />
                </ErrorBoundary>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetailPage;