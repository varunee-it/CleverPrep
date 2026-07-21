import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Target, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

import quizService from '../../services/quizeService.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import Modal from '../../components/common/Modal.jsx';
import toast from 'react-hot-toast';

const QuizResultPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showRetakeModal, setShowRetakeModal] = useState(false);

  const handleBack = (e) => {
    e.preventDefault();
    const quiz = results?.data?.quiz;
    const docId = quiz?.document?._id || quiz?.documentId || (quiz?.document && typeof quiz.document === 'object' ? quiz.document._id : quiz?.document);
    if (location.state?.from) {
      navigate(location.state.from);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (docId) {
      navigate(`/documents/${docId}?tab=Quizzes`);
    } else {
      navigate('/documents');
    }
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await quizService.getQuizResults(quizId);
        setResults(data);
      } catch (error) {
        setError(error);
        toast.error(error.message || 'Failed to fetch quiz results.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quizId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    let title = "Error";
    let message = error.message || "An unexpected error occurred.";
    
    if (error.status === 400) {
      title = "Quiz Incomplete";
      message = "This quiz has not been completed yet. Please complete it first to view the results.";
    } else if (error.status === 401) {
      title = "Unauthorized";
      message = "You must be logged in to view these results.";
    } else if (error.status === 403) {
      title = "Access Denied";
      message = "You do not have permission to view these quiz results.";
    } else if (error.status === 404) {
      title = "Not Found";
      message = "The requested quiz or results could not be found.";
    } else if (error.status === 500) {
      title = "Server Error";
      message = "A server error occurred. Please try again later.";
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4 font-display">
        <div className="text-center max-w-md bg-white border border-slate-200/85 p-8 rounded-3xl shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-500 text-xl select-none">
            ⚠️
          </div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed font-medium">{message}</p>
          <button
            onClick={() => navigate('/documents')}
            className="mt-6 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Go to Documents
          </button>
        </div>
      </div>
    );
  }

  if (!results || !results.data || !results.data.quiz || !Array.isArray(results.data.results)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Quiz results not found or malformed.</p>
        </div>
      </div>
    );
  }

  const { data: { quiz, results: detailedResults } } = results;

  const score = quiz.score;
  const totalQuestions = detailedResults.length;
  const correctAnswers = detailedResults.filter(r => r.isCorrect).length;
  const incorrectAnswers = totalQuestions - correctAnswers;

  // Calculate Time Taken safely
  const start = quiz.createdAt ? new Date(quiz.createdAt).getTime() : null;
  const end = quiz.completedAt ? new Date(quiz.completedAt).getTime() : null;
  let timeTakenStr = "N/A";
  if (start && end && !isNaN(start) && !isNaN(end)) {
    const diffSecs = Math.max(1, Math.round((end - start) / 1000));
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    timeTakenStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  const getScoreColorClass = (score) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 75) return 'text-teal-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreColorGradients = (score) => {
    if (score >= 90) return 'from-emerald-500 to-teal-500';
    if (score >= 75) return 'from-teal-500 to-cyan-500';
    if (score >= 50) return 'from-amber-500 to-orange-500';
    return 'from-rose-500 to-red-500';
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return 'Excellent! 🌟';
    if (score >= 75) return 'Great Job! 🎉';
    if (score >= 50) return 'Good Effort 👍';
    return 'Keep Practicing 💪';
  };

  const handleConfirmRetake = async () => {
    try {
      setShowRetakeModal(false);
      setLoading(true);
      await quizService.retakeQuiz(quizId);
      toast.success("Quiz reset. Good luck!");
      navigate(`/quizzes/${quizId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to retake quiz.');
      setLoading(false);
    }
  };

  // Render SVG Circular Progress Indicator
  const renderCircularProgress = () => {
    const strokeWidth = 10;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center w-40 h-40 mx-auto select-none">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="text-slate-100"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            className={`${getScoreColorClass(score)} transition-all duration-1000 ease-out`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-slate-800 font-display">
            {score}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Score
          </span>
        </div>
      </div>
    );
  };

  const renderSummaryView = () => {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 select-none">
        {/* Premium Score Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xs text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-100 to-teal-100 shadow-lg shadow-emerald-500/10">
            <Trophy className="w-7 h-7 text-emerald-600" strokeWidth={2} />
          </div>

          {/* SVG Progress Circle */}
          {renderCircularProgress()}

          <div>
            <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight font-display">
              {getScoreMessage(score)}
            </h3>
            <p className="text-sm font-semibold text-slate-400 mt-1">
              Assessment Summary
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-6 border-t border-slate-100 text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📊 Percentage</span>
              <span className="text-base font-extrabold text-slate-700 block">{score}%</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">✅ Correct</span>
              <span className="text-base font-extrabold text-emerald-600 block">{correctAnswers} answers</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">❌ Incorrect</span>
              <span className="text-base font-extrabold text-rose-600 block">{incorrectAnswers} answers</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">⏱ Time Taken</span>
              <span className="text-base font-extrabold text-slate-700 block">{timeTakenStr}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="space-y-3 pt-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left mb-2">
            Quiz Options
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setIsReviewing(true)}
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm transition-all duration-200 active:scale-98 shadow-md hover:shadow-lg hover:shadow-emerald-500/10 outline-hidden"
            >
              <Target className="w-4.5 h-4.5" />
              Review Answers
            </button>
            <button
              onClick={() => setShowRetakeModal(true)}
              className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-bold text-sm transition-all duration-200 active:scale-98 shadow-xs hover:shadow-md outline-hidden"
            >
              <RotateCcw className="w-4.5 h-4.5 text-slate-500" />
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderReviewView = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Back to Summary */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setIsReviewing(false)}
            className="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors outline-hidden"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Results Summary
          </button>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md">
            Reviewing Question {currentReviewIndex + 1} of {totalQuestions}
          </span>
        </div>

        {/* Question Navigator below the Header */}
        <div className="flex items-center justify-center gap-1.5 py-3 border-y border-slate-200/60 flex-wrap select-none bg-slate-50/50 rounded-2xl">
          {detailedResults.map((r, idx) => {
            const isCurrent = idx === currentReviewIndex;
            const isCorrect = r.isCorrect;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentReviewIndex(idx)}
                className={`w-7.5 h-7.5 rounded-lg font-bold text-xs transition-all duration-200 active:scale-95 ${
                  isCurrent
                    ? 'ring-2 ring-emerald-500 ring-offset-1 text-white ' + (isCorrect ? 'bg-emerald-500 shadow-xs' : 'bg-rose-500 shadow-xs')
                    : isCorrect
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-rose-55 border border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
                style={{ backgroundColor: !isCurrent ? (isCorrect ? '#ecfdf5' : '#fef2f2') : undefined }}
                aria-label={`Jump to review question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Detailed Question Review card */}
        {detailedResults.map((result, index) => {
          if (index !== currentReviewIndex) return null;

          const userAnswerIndex = result.options.indexOf(result.selectedAnswer);
          const correctAnswerIndex = result.correctAnswer.startsWith('0')
            ? parseInt(result.correctAnswer.substring(1)) - 1
            : result.options.indexOf(result.correctAnswer);
          const isCorrect = result.isCorrect;

          return (
            <div key={index} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className={`bg-white border border-slate-200 rounded-3xl shadow-xs transition-all ${
                isCorrect ? 'p-5 sm:p-6' : 'p-6 sm:p-8'
              }`}>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-xs font-bold text-slate-600">
                      QUESTION {index + 1}
                    </span>
                  </div>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-extrabold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-lg text-xs font-extrabold text-rose-700">
                      <XCircle className="w-4 h-4" />
                      Incorrect
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-5 leading-relaxed">
                  {result.question}
                </h3>

                <div className="space-y-3 select-none">
                  {result.options.map((option, optIndex) => {
                    const isCorrectOption = optIndex === correctAnswerIndex;
                    const isUserAnswer = optIndex === userAnswerIndex;
                    const isWrongUserAnswer = isUserAnswer && !isCorrect;

                    return (
                      <div
                        key={optIndex}
                        className={`relative px-4 py-3 border-2 rounded-xl flex items-center justify-between ${
                          isCorrectOption
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                            : isWrongUserAnswer
                              ? 'border-rose-400 bg-rose-50/40 shadow-xs'
                              : 'border-slate-200 bg-white opacity-85'
                        }`}
                      >
                        <span className={`text-sm font-semibold ${
                          isCorrectOption
                            ? 'text-emerald-950 font-bold'
                            : isWrongUserAnswer
                              ? 'text-rose-950 font-bold'
                              : 'text-slate-600'
                        }`}>
                          {option}
                        </span>

                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          {isCorrectOption && (
                            <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-300 rounded-md py-0.5 px-2 text-emerald-700 uppercase">
                              Correct Answer
                            </span>
                          )}
                          {isWrongUserAnswer && (
                            <span className="text-[10px] font-bold bg-rose-50 border border-rose-300 rounded-md py-0.5 px-2 text-rose-700 uppercase">
                              Your Attempt
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation - incorrect answers only (when explanation exists) */}
                {!isCorrect && result.explanation && result.explanation !== "No explanation" && (
                  <div className="mt-5 p-4.5 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3 text-left animate-in fade-in duration-300">
                    <span className="text-xl shrink-0 select-none">💡</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Explanation
                      </h4>
                      <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-semibold">
                        {result.explanation}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-center items-center gap-6 mt-4 select-none">
                <button
                  onClick={() => setCurrentReviewIndex(p => Math.max(0, p - 1))}
                  disabled={currentReviewIndex === 0}
                  className="w-13 h-13 rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:translate-y-0 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-slate-500 hover:text-slate-800 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-hidden"
                >
                  <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <span className="text-sm font-bold text-slate-500 bg-slate-100 border border-slate-200 px-4 py-2 rounded-full min-w-[85px] text-center">
                  {currentReviewIndex + 1} / {totalQuestions}
                </span>
                <button
                  onClick={() => setCurrentReviewIndex(p => Math.min(totalQuestions - 1, p + 1))}
                  disabled={currentReviewIndex === totalQuestions - 1}
                  className="w-13 h-13 rounded-full border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white disabled:hover:translate-y-0 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-slate-500 hover:text-slate-800 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 outline-hidden"
                >
                  <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      {!isReviewing && (
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" strokeWidth={2} />
            Back to Document
          </button>
        </div>
      )}

      <PageHeader title={isReviewing ? "Review Answers" : "🎉 Quiz Complete"} />

      {isReviewing ? renderReviewView() : renderSummaryView()}

      {/* Retake Confirmation Dialog */}
      <Modal
        isOpen={showRetakeModal}
        onClose={() => setShowRetakeModal(false)}
        title="Retake Quiz?"
      >
        <div className="space-y-6 py-2 select-none">
          <p className="text-sm text-slate-600 font-semibold leading-relaxed">
            This will erase your previous attempt and start a fresh quiz. Are you sure you want to start again?
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowRetakeModal(false)}
              className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all outline-hidden"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRetake}
              className="px-5 h-11 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 outline-hidden"
            >
              Start Again
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuizResultPage;
