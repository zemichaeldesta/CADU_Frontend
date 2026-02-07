import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Programs from './pages/Programs';
import Initiatives from './pages/Initiatives';
import Resources from './pages/Resources';
import News from './pages/News';
import Events from './pages/Events';
import MemberEvents from './pages/MemberEvents';
import Gallery from './pages/Gallery';
import Photos from './pages/Photos';
import Videos from './pages/Videos';
import Members from './pages/Members';
import Contact from './pages/Contact';
import RegisterNew from './pages/RegisterNew';
import NotFound from './pages/NotFound';
import Login from './pages/admin/Login';
import MemberLogin from './pages/MemberLogin';
import MemberDashboard from './pages/MemberDashboard';
import MemberAccount from './pages/MemberAccount';
import MemberPayments from './pages/MemberPayments';
import MemberResources from './pages/MemberResources';
import MemberProtectedRoute from './components/MemberProtectedRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import PageEditor from './pages/admin/PageEditor';
import PageManager from './pages/admin/PageManager';
import ImageManager from './pages/admin/ImageManager';
import ArchiveManager from './pages/admin/ArchiveManager';
import MemberManager from './pages/admin/MemberManager';
import EventManager from './pages/admin/EventManager';
import MessageManager from './pages/admin/MessageManager';
import GalleryManager from './pages/admin/GalleryManager';
import ContactInfoManager from './pages/admin/ContactInfoManager';
import CADUMemberManager from './pages/admin/CADUMemberManager';
import MemberApplicationsManager from './pages/admin/MemberApplicationsManager';
import CADUMembersManager from './pages/admin/CADUMembersManager';
import PaymentsManager from './pages/admin/PaymentsManager';
import MembersDirectory from './pages/admin/MembersDirectory';
import ZohoEmailConfig from './pages/admin/ZohoEmailConfig';
import LogsManager from './pages/admin/LogsManager';
import './App.css';

function App() {
  // Get basename from homepage or default to root
  const basename = process.env.PUBLIC_URL || '';
  
  return (
    <ErrorBoundary>
      <Router basename={basename}>
        <ToastProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/admin/login" element={<Login />} />
              <Route path="/member-login" element={<MemberLogin />} />
              <Route
                path="/member-dashboard"
                element={
                  <MemberProtectedRoute>
                    <MemberDashboard />
                  </MemberProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pages"
                element={
                  <ProtectedRoute>
                    <PageManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pages/:pageType"
                element={
                  <ProtectedRoute>
                    <PageEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/images"
                element={
                  <ProtectedRoute>
                    <ImageManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/archive"
                element={
                  <ProtectedRoute>
                    <ArchiveManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/admins"
                element={
                  <ProtectedRoute>
                    <MemberManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/events"
                element={
                  <ProtectedRoute>
                    <EventManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/messages"
                element={
                  <ProtectedRoute>
                    <MessageManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/gallery"
                element={
                  <ProtectedRoute>
                    <GalleryManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/contact-info"
                element={
                  <ProtectedRoute>
                    <ContactInfoManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cadu-members"
                element={
                  <ProtectedRoute>
                    <CADUMembersManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/member-applications"
                element={
                  <ProtectedRoute>
                    <MemberApplicationsManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payments"
                element={
                  <ProtectedRoute>
                    <PaymentsManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/members-directory"
                element={
                  <ProtectedRoute>
                    <MembersDirectory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/zoho-email"
                element={
                  <ProtectedRoute>
                    <ZohoEmailConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/logs"
                element={
                  <ProtectedRoute>
                    <LogsManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/programs" element={<Programs />} />
                      <Route path="/initiatives" element={<Initiatives />} />
                      <Route path="/resources" element={<Resources />} />
                      <Route path="/news" element={<News />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/member-events" element={<MemberEvents />} />
                      <Route path="/gallery" element={<Photos />} />
                      <Route path="/photos" element={<Photos />} />
                      <Route path="/videos" element={<Videos />} />
                      <Route path="/members" element={<Members />} />
                      <Route path="/contact" element={<Contact />} />
                      {/* Use the new registration form as the primary registration page */}
                      <Route path="/register" element={<RegisterNew />} />
                      {/* Optional alias for backwards compatibility */}
                      <Route path="/register-new" element={<RegisterNew />} />
                      {/* Member authenticated routes */}
                      <Route
                        path="/member-account"
                        element={
                          <MemberProtectedRoute>
                            <MemberAccount />
                          </MemberProtectedRoute>
                        }
                      />
                      <Route
                        path="/member-payments"
                        element={
                          <MemberProtectedRoute>
                            <MemberPayments />
                          </MemberProtectedRoute>
                        }
                      />
                      <Route
                        path="/member-resources"
                        element={
                          <MemberProtectedRoute>
                            <Resources memberMode={true} usePersonalResources={true} />
                          </MemberProtectedRoute>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
          </LanguageProvider>
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
