import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar        from './components/Navbar';
import LoginPage     from './pages/LoginPage';
import SignupPage    from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';

const Protected = ({ children }) =>
  localStorage.getItem('token') ? children : <Navigate to="/login" />;

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Navigate to="/dashboard" />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/signup"    element={<SignupPage />} />
        <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      </Routes>
    </BrowserRouter>
  );
}
