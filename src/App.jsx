import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';
import ReaderLayout from './components/layout/ReaderLayout';
import Home from './pages/Home';
import About from './pages/About';
import Articles from './pages/Articles';
import useUserStore from './store/userStore';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';

import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import Library from './pages/Library';
import ArticleDetails from './pages/ArticleDetails';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Favourites from './pages/Favourites';
import ReadArticle from './pages/ReadArticle';
import NotFound from './pages/NotFound';
import { AnimatePresence } from 'framer-motion';

function App() {
  const initialize = useUserStore((state) => state.initialize);
  const location = useLocation();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* PUBLIC ROUTES (Navbar Layout) */}
        {/* PUBLIC ROUTES (Navbar Layout) */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="articles" element={<Articles />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="update-password" element={<UpdatePassword />} />
        </Route>

        {/* AUTH ROUTES (Standalone) */}
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />

        {/* IMMERSIVE READER ROUTES (Minimalist Layout) */}
        <Route element={<ReaderLayout />}>
          <Route path="article/:id" element={<ArticleDetails />} />
          <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
            <Route path="read/:id" element={<ReadArticle />} />
          </Route>
        </Route>

        {/* AUTHENTICATED APP ROUTES (Sidebar Layout) */}
        <Route element={<Layout />}>
          <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
            <Route path="library" element={<Library />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="favourites" element={<Favourites />} />
            <Route path="browse" element={<Articles />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="admin" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* CATCH-ALL ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
