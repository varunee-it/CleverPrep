import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DocumentListPage from './pages/Documents/DocumentListPage';
import DocumentsDetailPage from './pages/Documents/DocumentsDetailPage';
import FlashcardPage from './pages/Flashcards/FlashcardPage';
import FlashcardsListPage from './pages/Flashcards/FlashcardsListPage';
import QuizResultPage from './pages/Quizzes/QuizResultPage';
import QuizTakePage from './pages/Quizzes/QuizTakePage';
import ProfilePage from './pages/Profile/ProfilePage';
import SharedChatPage from './pages/SharedChatPage';

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
        </Route>

        <Route path='*' element={<h1>Not Found</h1>} />
      </Routes>
    </Router>
  );
};

export default App;