import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import PublicLayout from './components/layout/PublicLayout';
import ReaderLayout from './components/layout/ReaderLayout';
import Home from './pages/Home';
import About from './pages/About';
import Articles from './pages/Articles';
import EditorialBoard from './pages/EditorialBoard';
import AuthorGuidelines from './pages/AuthorGuidelines';
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
import SubmitManuscript from './pages/SubmitManuscript';
import MyManuscripts from './pages/MyManuscripts';
import ManuscriptStatus from './pages/ManuscriptStatus';
import EditorDashboard from './pages/EditorDashboard';
import ManuscriptEditorView from './pages/ManuscriptEditorView';
import PipelineOverview from './pages/PipelineOverview';
import ReviewerDashboard from './pages/ReviewerDashboard';
import ReviewForm from './pages/ReviewForm';
import NotFound from './pages/NotFound';
import { AnimatePresence } from 'framer-motion';

// Every signed-in role. Generic account pages (library, profile, settings,
// browsing, reading) should be open to all of them — only the role-specific
// dashboards below (editor/chief_editor, reviewer, admin) narrow further.
const ANY_SIGNED_IN_ROLE = ['user', 'admin', 'editor', 'chief_editor', 'reviewer'];

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
          <Route path="editorial-board" element={<EditorialBoard />} />
          <Route path="guidelines" element={<AuthorGuidelines />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="update-password" element={<UpdatePassword />} />
        </Route>

        {/* AUTH ROUTES (Standalone) */}
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />

        {/* IMMERSIVE READER ROUTES (Minimalist Layout) */}
        <Route element={<ReaderLayout />}>
          <Route path="article/:id" element={<ArticleDetails />} />
          <Route element={<ProtectedRoute allowedRoles={ANY_SIGNED_IN_ROLE} />}>
            <Route path="read/:id" element={<ReadArticle />} />
          </Route>
        </Route>

        {/* AUTHENTICATED APP ROUTES (Sidebar Layout) */}
        <Route element={<Layout />}>
          <Route element={<ProtectedRoute allowedRoles={ANY_SIGNED_IN_ROLE} />}>
            <Route path="library" element={<Library />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="favourites" element={<Favourites />} />
            <Route path="browse" element={<Articles />} />
          </Route>

          {/* MANUSCRIPT PIPELINE — open to any signed-in role; editors, reviewers
              and admins may also submit as authors */}
          <Route element={<ProtectedRoute allowedRoles={ANY_SIGNED_IN_ROLE} />}>
            <Route path="submit" element={<SubmitManuscript />} />
            <Route path="manuscripts" element={<MyManuscripts />} />
            <Route path="manuscripts/:id" element={<ManuscriptStatus />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['editor', 'chief_editor', 'admin']} />}>
            <Route path="editor" element={<EditorDashboard />} />
            <Route path="editor/:id" element={<ManuscriptEditorView />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['chief_editor', 'admin']} />}>
            <Route path="editor-overview" element={<PipelineOverview />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['reviewer', 'admin']} />}>
            <Route path="reviewer" element={<ReviewerDashboard />} />
            <Route path="reviewer/:assignmentId" element={<ReviewForm />} />
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
