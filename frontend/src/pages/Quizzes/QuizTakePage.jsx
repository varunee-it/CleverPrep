import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

import quizService from '../../services/quizeService.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';

const QuizTakePage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await quizService.getQuizById(quizId);
        const data = response.data;
        
        // Redirect to results if quiz is already completed
        if (data.completedAt) {
          navigate(`/quizzes/${quizId}/results`);
          return;
        }

        setQuiz(data);

        // Pre-populate with previous user answers if any exist
        if (data.userAnswers && data.userAnswers.length > 0) {
          const answers = {};
          data.questions.forEach((q, qIndex) => {
            const userAnswer = data.userAnswers.find(a => a.questionIndex === qIndex);
            if (userAnswer) {
              const optIndex = q.options.indexOf(userAnswer.selectedAnswer);
              if (optIndex !== -1) {
                answers[q._id] = optIndex;
              }
            }
          });
          setSelectedAnswers(answers);
        }
      } catch (error) {
        toast.error('Failed to fetch quiz.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, navigate]);

  const handleOptionChange = (questionId, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (submitting) return; // Prevent duplicate submissions
    setSubmitting(true);
    try {
      const formattedAnswers = Object.keys(selectedAnswers).map(questionId => {
        const question = quiz.questions.find(q => q._id === questionId);
        const questionIndex = quiz.questions.findIndex(q => q._id === questionId);
        const optionIndex = selectedAnswers[questionId];
        const selectedAnswer = question.options[optionIndex];
        return { questionIndex, selectedAnswer };
      });

      await quizService.submitQuiz(quizId, formattedAnswers);
      toast.success('Quiz submitted successfully!');
      navigate(`/quizzes/${quizId}/results`);
    } catch (error) {
      toast.error(error.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!quiz || !quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 text-lg">Quiz not found or has no questions.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const hasAnsweredCurrentQuestion = selectedAnswers.hasOwnProperty(currentQuestion._id);
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = quiz.questions.length - answeredCount;
  const completionPct = Math.round((currentQuestionIndex / quiz.questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto select-none">
      <PageHeader title={quiz.title || 'Take Quiz'} />

      {/* Progress Section */}
      <div className="mb-6 space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </span>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            {completionPct}% Complete
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>

        {/* Compact Sub-Progress Question Navigator */}
        <div className="flex items-center justify-center gap-1.5 pt-1.5 flex-wrap border-t border-slate-100">
          {quiz.questions.map((q, idx) => {
            const isAnswered = selectedAnswers.hasOwnProperty(q._id);
            const isCurrent = idx === currentQuestionIndex;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentQuestionIndex(idx)}
                disabled={submitting}
                className={`w-7.5 h-7.5 rounded-lg font-bold text-xs transition-all duration-200 ${
                  isCurrent
                    ? 'ring-2 ring-emerald-500 ring-offset-1 bg-emerald-500 text-white shadow-xs'
                    : isAnswered
                      ? 'bg-emerald-100 border border-emerald-200 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-transparent hover:bg-slate-200'
                }`}
                aria-label={`Jump to question ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg mb-6">
          <span className="text-xs font-bold text-emerald-700">
            QUESTION {currentQuestionIndex + 1}
          </span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion._id] === index;
            return (
              <label
                key={index}
                className={`group relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.99] hover:-translate-y-0.5 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-md shadow-emerald-500/10'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={index}
                  checked={isSelected}
                  onChange={() => handleOptionChange(currentQuestion._id, index)}
                  className="sr-only"
                />
                
                {/* Custom Radio Button */}
                <div
                  className={`shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500'
                      : 'border-slate-300 bg-white group-hover:border-emerald-400'
                  }`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-in scale-in duration-200" />
                  )}
                </div>

                {/* Option Text */}
                <span
                  className={`ml-4 text-sm font-semibold transition-colors duration-200 ${
                    isSelected ? 'text-slate-800' : 'text-slate-600 group-hover:text-slate-800'
                  }`}
                >
                  {option}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 select-none">
        <Button
          onClick={handlePreviousQuestion}
          disabled={currentQuestionIndex === 0 || submitting}
          variant="secondary"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          Previous
        </Button>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting}
            className="group relative px-6 h-11 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-emerald-500/15 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed outline-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5" strokeWidth={2.5} />
              Submit Quiz
            </span>
          </button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            disabled={submitting}
          >
            Next
            <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </Button>
        )}
      </div>

      {/* Submit Loader Backdrop / Modal */}
      <Modal
        isOpen={submitting}
        onClose={() => {}}
        title="Evaluating"
        showClose={false}
      >
        <div className="py-8 text-center space-y-4 flex flex-col items-center justify-center select-none">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-base font-bold text-slate-800">
            Evaluating your answers...
          </p>
          <p className="text-xs text-slate-400 font-semibold">
            Gemini is grading your test results.
          </p>
        </div>
      </Modal>

      {/* Accidental Submission Confirmation Dialog */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => { if (!submitting) setShowSubmitModal(false); }}
        title="Submit Quiz"
      >
        {unansweredCount > 0 ? (
          <div className="space-y-6 py-2">
            <p className="text-sm text-slate-600 font-semibold leading-relaxed">
              You still have <span className="font-extrabold text-slate-900">{unansweredCount}</span> unanswered question(s).
              Would you like to review them first?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all outline-hidden"
              >
                Review Questions
              </button>
              <button
                type="button"
                onClick={() => { setShowSubmitModal(false); handleSubmitQuiz(); }}
                disabled={submitting}
                className="px-5 h-11 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 outline-hidden"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <p className="text-sm text-slate-600 font-semibold leading-relaxed">
              Are you sure you want to submit your quiz? You won't be able to change your answers after submission.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all outline-hidden"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setShowSubmitModal(false); handleSubmitQuiz(); }}
                disabled={submitting}
                className="px-5 h-11 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 outline-hidden"
              >
                Submit Quiz
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QuizTakePage;