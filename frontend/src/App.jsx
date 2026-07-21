import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { TourProvider } from './context/TourContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DocumentListPage from './pages/Documents/DocumentListPage';
import DocumentsDetailPage from './pages/Documents/DocumentsDetailPage';
import FlashcardPage from './pages/Flashcards/FlashcardPage';
import FlashcardsListPage from './pages/Flashcards/FlashcardsListPage';
import QuizResultPage from './pages/Quizzes/QuizResultPage';
import QuizTakePage from './pages/Quizzes/QuizTakePage';
import ProfilePage from './pages/Profile/ProfilePage';
import SharedChatPage from './pages/SharedChatPage';
import FocusWorkspacePage from './pages/Focus/FocusWorkspacePage';
import FocusHistoryPage from './pages/Focus/FocusHistoryPage';
import FocusAnalyticsPage from './pages/Focus/FocusAnalyticsPage';

import { StudySessionProvider } from './contexts/StudySessionContext';

const App = () => {
  const { isAuthenticated,loading } = useAuth();
  

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <StudySessionProvider>
        <TourProvider>
          <Routes>
          <Route
            path='/'
            element={
              isAuthenticated ? (
                <Navigate to='/dashboard' replace />
              ) : (
                <Navigate to='/login' replace />
              )
            }
          />

          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/forgot-password' element={<ForgotPasswordPage />} />
          <Route path='/reset-password/:token' element={<ResetPasswordPage />} />
          <Route path='/verify-email' element={<VerifyEmailPage />} />
          <Route path='/verify-email/:token' element={<VerifyEmailPage />} />
          
          {/* Public Shared Routes */}
          <Route path='/share/:shareId' element={<SharedChatPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute/>}>
          <Route path='/dashboard' element={<DashboardPage/>} />
          <Route path='/documents' element={<DocumentListPage/>}/>
          <Route path='/documents/:id' element={<DocumentsDetailPage/>}/>
          <Route path='/flashcards' element={<FlashcardsListPage/>}/>
          <Route path='/documents/:id/flashcards' element={<FlashcardPage/>}/>
          <Route path='/quizzes/:id/flashcards' element={<FlashcardPage/>}/>
          <Route path='/quizzes/:quizId' element={<QuizTakePage />} />
          <Route path='/quizzes/:quizId/results' element={<QuizResultPage />} />
          <Route path='/profile' element={<ProfilePage/>}/>
          <Route path='/focus' element={<FocusWorkspacePage/>}/>
          <Route path='/focus/history' element={<FocusHistoryPage/>}/>
          <Route path='/focus/analytics' element={<FocusAnalyticsPage/>}/>
          </Route>

          <Route path='*' element={<h1>Not Found</h1>} />
        </Routes>
        </TourProvider>
      </StudySessionProvider>
    </Router>
  );
};

export default App;