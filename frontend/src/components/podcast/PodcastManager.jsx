import { useState, useEffect } from 'react';
import { Headphones, Play, Plus, Clock, Mic, Loader2, CheckCircle2, Languages, User, ListFilter, MessageSquare, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import podcastService from '../../services/podcastService';
import PodcastPlayer from './PodcastPlayer';
import { isValidDisplayName, validateStudyName } from '../../utils/nameValidation';

import { useAuth } from '../../context/AuthContext';

const PodcastManager = ({ documentId, documentTitle }) => {
  const { user } = useAuth();
  const [podcasts, setPodcasts] = useState([]);
  const [failedJobs, setFailedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activePodcast, setActivePodcast] = useState(null);
  const [generationStep, setGenerationStep] = useState(0); // Legacy visual step, mostly unused now
  const [activeJob, setActiveJob] = useState(null);

  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const [nameError, setNameError] = useState('');
  const [rememberName, setRememberName] = useState(true);

  const [formData, setFormData] = useState({
    studyMood: 'Normal Study',
    teacherVoice: 'Sarah',
    studentVoice: 'Female',
    language: 'English',
    accent: 'Indian',
    length: '10 min',
    personality: 'University Professor',
    indianStudentMode: false,
    liveCaptions: true,
    difficultWords: false,
    askQuestions: false
  });

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      const res = await podcastService.getPodcasts(documentId);
      setPodcasts(res.data);
      setFailedJobs(res.failedJobs || []);
      if (res.data.length > 0) {
        setActivePodcast(res.data[0]);
      } else {
        setShowCreateForm(true);
      }
    } catch (e) {
      toast.error('Failed to load podcasts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodcasts();
  }, [documentId]);

  const hasValidAccountName = () => {
      if (user?.fullName && isValidDisplayName(user.fullName.split(" ")[0])) return true;
      if (user?.firstName && isValidDisplayName(user.firstName)) return true;
      if (user?.displayName && isValidDisplayName(user.displayName)) return true;
      if (user?.username && isValidDisplayName(user.username.trim())) return true;
      return false;
  };

  const handleGenerateClick = () => {
      if (hasValidAccountName()) {
          executeGeneration();
          return;
      }
      if (localStorage.getItem('preferredStudyName')) {
          executeGeneration();
          return;
      }
      if (sessionStorage.getItem('skipNamePrompt')) {
          executeGeneration();
          return;
      }
      
      setShowNameModal(true);
  };

  const handleModalContinue = () => {
      const validation = validateStudyName(tempName);
      if (!validation.isValid) {
          setNameError(validation.error);
          return;
      }
      
      setNameError('');
      const finalName = validation.formattedName;
      
      if (rememberName) {
          localStorage.setItem('preferredStudyName', finalName);
      }
      
      setShowNameModal(false);
      executeGeneration(finalName);
  };

  const handleModalSkip = () => {
      sessionStorage.setItem('skipNamePrompt', 'true');
      setShowNameModal(false);
      executeGeneration();
  };

  const executeGeneration = async (preferredNameOverride = null) => {
    setIsGenerating(true);
    setActiveJob(null);
    setGenerationStep(1); // Optional legacy visual step for initial loading UI

    try {
      const payload = {
        ...formData,
        documentTitle,
        preferredStudyName: preferredNameOverride || localStorage.getItem('preferredStudyName') || null
      };
      // Start the job asynchronously
      const res = await podcastService.generatePodcast(documentId, payload);
      
      // Response gives { success: true, jobId: "..." }
      if (res.jobId) {
          // Immediately set a local placeholder job to start polling
          setActiveJob({ _id: res.jobId, status: 'pending', stepLabel: 'Initializing job...' });
      } else {
          // Fallback if backend returned podcast directly
          setPodcasts([res.data, ...podcasts]);
          setActivePodcast(res.data);
          setShowCreateForm(false);
          setIsGenerating(false);
          toast.success("Podcast generated successfully!");
      }
    } catch (error) {
      toast.error(error.message || 'Failed to start generation.');
      setIsGenerating(false);
    }
  };

  // Poll activeJob
  useEffect(() => {
      let interval;
      
      const pollJob = async () => {
          if (!activeJob || !activeJob._id) return;
          if (activeJob.status === 'completed' || activeJob.status === 'failed') return;
          
          try {
              const res = await podcastService.getJob(activeJob._id);
              if (res.data) {
                  setActiveJob(res.data);
                  
                  if (res.data.status === 'completed') {
                      setIsGenerating(false);
                      toast.success("Study Session ready!");
                      if (res.data.podcastId) {
                           // Fetch the new podcast
                           const newPodcastRes = await podcastService.getPodcastById(res.data.podcastId);
                           setPodcasts([newPodcastRes.data, ...podcasts]);
                           setActivePodcast(newPodcastRes.data);
                           setShowCreateForm(false);
                      } else {
                           // Reload all
                           fetchPodcasts();
                      }
                  } else if (res.data.status === 'failed') {
                      toast.error("Generation failed. Please try again.");
                  }
              }
          } catch (e) {
              console.error("Polling error:", e);
          }
      };

      if (activeJob && activeJob.status !== 'completed' && activeJob.status !== 'failed') {
          interval = setInterval(pollJob, 1500);
      }
      
      return () => {
          if (interval) clearInterval(interval);
      };
  }, [activeJob, podcasts]);

  const handleRetryJob = async () => {
      if (!activeJob || !activeJob._id) return;
      try {
          const res = await podcastService.retryJob(activeJob._id);
          setActiveJob({ _id: res.jobId, status: 'pending', stepLabel: 'Recovering from temporary error...' });
          toast.success("Retrying...");
      } catch (error) {
          toast.error(error.message || "Failed to retry");
      }
  };

  const handleRetryFailedJob = async (jobId) => {
      try {
          const res = await podcastService.retryJob(jobId);
          setActiveJob({ _id: res.jobId, status: 'pending', stepLabel: 'Recovering from temporary error...' });
          setFailedJobs(prev => prev.filter(j => j._id !== jobId));
          toast.success("Retrying...");
      } catch (error) {
          toast.error(error.message || "Failed to retry");
      }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  const studyMoods = ['Exam Tomorrow', 'Normal Study', 'Quick Revision', 'Deep Learning', 'Beginner Mode'];
  const voices = ['Sarah', 'Alex', 'Mentor', 'Coach'];
  const languages = ['English', 'Simple English', 'Hinglish'];
  const accents = ['Indian', 'US', 'UK'];
  const lengths = ['5 min', '10 min', '20 min', '40 min'];
  const personalities = ['University Professor', 'College Senior', 'Exam Coach', 'Story Teller', 'Fun Teacher', 'Study Buddy'];

  const pipelineSteps = [
      { id: 1, label: "Reading PDF", icon: "📄" },
      { id: 2, label: "Understanding Concepts", icon: "🧠" },
      { id: 3, label: "Creating Podcast Script", icon: "✍" },
      { id: 4, label: "Opening Study Workspace...", icon: "🚀" }
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Onboarding Modal Overlay */}
      {showNameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-md w-full p-8 zoom-in-95 animate-in">
             <h2 className="text-2xl font-extrabold text-slate-800 mb-2">👋 Before we begin...</h2>
             <p className="text-slate-500 mb-6 font-medium">I'd love to make this study session feel more personal.</p>
             
             <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">What should I call you during our study sessions?</label>
                <input 
                    type="text" 
                    value={tempName}
                    onChange={(e) => {
                        setTempName(e.target.value);
                        if (nameError) setNameError('');
                    }}
                    onBlur={() => {
                        if (tempName) {
                            const val = validateStudyName(tempName);
                            if (!val.isValid) setNameError(val.error);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleModalContinue();
                    }}
                    autoFocus
                    placeholder="Enter your preferred name..."
                    className={`w-full px-4 py-3 rounded-xl border ${nameError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-200'} bg-slate-50 focus:bg-white transition-all outline-none focus:ring-4`}
                />
                {nameError && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{nameError}</p>
                )}
             </div>

             <label className="flex items-center gap-3 mb-8 cursor-pointer group">
                 <input 
                    type="checkbox" 
                    checked={rememberName} 
                    onChange={(e) => setRememberName(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                 />
                 <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">Remember this name for future study sessions</span>
             </label>

             <div className="flex flex-col gap-3">
                 <button 
                    onClick={handleModalContinue}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
                 >
                    Continue Learning
                 </button>
                 <button 
                    onClick={handleModalSkip}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
                 >
                    Skip
                 </button>
             </div>
          </div>
        </div>
      )}

      {!showCreateForm && activePodcast && (
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Headphones className="text-emerald-500" />
            AI Study Podcast
          </h2>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus size={16} /> New Episode
          </button>
        </div>
      )}

      {failedJobs.length > 0 && !activeJob && (
          <div className="mb-6 bg-red-50 rounded-2xl border border-red-100 p-6">
              <h3 className="text-red-800 font-bold mb-4 flex items-center gap-2"><Zap size={20} /> Failed Generations</h3>
              <div className="space-y-3">
                  {failedJobs.map(job => (
                      <div key={job._id} className="bg-white rounded-xl p-4 border border-red-100 flex items-center justify-between">
                          <div>
                              <p className="font-bold text-slate-800">{job.settings?.documentTitle || 'Study Material'}</p>
                              <p className="text-sm text-slate-500">{job.stepLabel || 'Generation failed'}</p>
                          </div>
                          <button 
                              onClick={() => handleRetryFailedJob(job._id)}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-lg transition-colors text-sm"
                          >
                              Retry
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {showCreateForm ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                        <Mic className="text-emerald-500" size={28} />
                        Create AI Study Session
                    </h3>
                    <p className="text-slate-500">Your Personal AI Tutoring Session.</p>
                </div>

                {isGenerating || activeJob ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                        <div className="w-full max-w-md bg-slate-50 border border-slate-100 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
                            {activeJob?.status === 'failed' ? (
                                <>
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                        <Zap className="text-red-500" size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">Generation Failed</h3>
                                    <p className="text-slate-500 font-medium mb-6">
                                        {activeJob.stepLabel || "We couldn't finish generating your study session."}
                                    </p>
                                    <div className="flex gap-3 w-full">
                                        <button 
                                            onClick={handleRetryJob}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-[0.98]"
                                        >
                                            Retry
                                        </button>
                                        <button 
                                            onClick={() => { setActiveJob(null); setIsGenerating(false); }}
                                            className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-xl transition-all active:scale-[0.98]"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
                                        <Loader2 className="animate-spin text-emerald-500 relative z-10" size={56} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                                        {activeJob?.status === 'retrying' ? 'Recovering...' : 'Generating Study Session...'}
                                    </h3>
                                    <p className="text-emerald-600 font-semibold mb-6 flex items-center justify-center gap-2">
                                        {activeJob?.stepLabel || "Initializing..."}
                                    </p>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                                            style={{ width: `${activeJob?.progress || 0}%` }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                <div className="space-y-8">
                    {/* Style & Personality */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <ListFilter size={16} className="text-emerald-500" /> Study Mood
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {studyMoods.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFormData({...formData, studyMood: s})}
                                        className={`px-3 py-2 text-center rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                                            formData.studyMood === s 
                                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' 
                                            : 'border-slate-200 hover:border-emerald-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <User size={16} className="text-emerald-500" /> Teaching Personality
                            </label>
                            <select 
                                value={formData.personality}
                                onChange={(e) => setFormData({...formData, personality: e.target.value})}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700 outline-none"
                            >
                                {personalities.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Voice & Lang */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Mic size={16} className="text-emerald-500" /> Teacher Voice
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {voices.map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setFormData({...formData, teacherVoice: v})}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                                            formData.teacherVoice === v 
                                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' 
                                            : 'border-slate-200 hover:border-emerald-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <User size={16} className="text-emerald-500" /> Student Voice
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['Female', 'Male'].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setFormData({...formData, studentVoice: v})}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium flex items-center gap-1.5 ${
                                            formData.studentVoice === v 
                                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' 
                                            : 'border-slate-200 hover:border-emerald-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {v === 'Female' ? '👩' : '👨'} {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <Languages size={16} className="text-emerald-500" /> Language
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {languages.map(l => (
                                    <button
                                        key={l}
                                        onClick={() => setFormData({...formData, language: l})}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                                            formData.language === l 
                                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' 
                                            : 'border-slate-200 hover:border-emerald-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <MessageSquare size={16} className="text-emerald-500" /> Accent
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {accents.map(a => (
                                    <button
                                        key={a}
                                        onClick={() => setFormData({...formData, accent: a})}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                                            formData.accent === a 
                                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' 
                                            : 'border-slate-200 hover:border-emerald-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {a}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Length */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <Clock size={16} className="text-emerald-500" /> Length
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {lengths.map(l => (
                                <button
                                    key={l}
                                    onClick={() => setFormData({...formData, length: l})}
                                    className={`px-5 py-2.5 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                                        formData.length === l 
                                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700' 
                                        : 'border-slate-200 hover:border-emerald-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                            <input 
                                type="checkbox" 
                                checked={formData.indianStudentMode} 
                                onChange={(e) => setFormData({...formData, indianStudentMode: e.target.checked})}
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                Indian Student Mode <Zap size={14} className="text-amber-500"/>
                            </span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                            <input 
                                type="checkbox" 
                                checked={formData.liveCaptions} 
                                onChange={(e) => setFormData({...formData, liveCaptions: e.target.checked})}
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-semibold text-slate-700">Live Captions</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                            <input 
                                type="checkbox" 
                                checked={formData.difficultWords} 
                                onChange={(e) => setFormData({...formData, difficultWords: e.target.checked})}
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-semibold text-slate-700">Explain Difficult Words</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                            <input 
                                type="checkbox" 
                                checked={formData.askQuestions} 
                                onChange={(e) => setFormData({...formData, askQuestions: e.target.checked})}
                                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-semibold text-slate-700">Ask Questions During Podcast</span>
                        </label>
                    </div>
                </div>
                )}

                {!isGenerating && (
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                    {podcasts.length > 0 ? (
                        <button 
                            onClick={() => setShowCreateForm(false)}
                            className="text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    ) : <div></div>}
                    <button
                        onClick={handleGenerateClick}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white shadow-md transition-all bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
                    >
                        <Play size={18} fill="currentColor" /> Generate Session
                    </button>
                </div>
                )}
            </div>
        </div>
      ) : (
        activePodcast && (
            <div className="w-full flex flex-col gap-4">
                <div className="flex justify-end w-full max-w-7xl mx-auto px-4">
                    <button 
                        onClick={() => setShowCreateForm(true)} 
                        className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-5 py-2.5 rounded-xl border border-emerald-200 transition-all shadow-sm"
                    >
                        <Zap size={16} /> Regenerate Study Session
                    </button>
                </div>
                <PodcastPlayer key={activePodcast._id} podcast={activePodcast} />
            </div>
        )
      )}
    </div>
  );
};

export default PodcastManager;
