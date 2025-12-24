import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Modules from './pages/Modules';
import VideoPlayer from './pages/VideoPlayer';
import Quiz from './pages/Quiz';
import ExamRegistration from './pages/ExamRegistration';
import MyExams from './pages/MyExams';
import Analytics from './pages/Analytics';
import Evaluation from './pages/Evaluation';
import Assignments from './pages/Assignments';
import Announcements from './pages/Announcements';
import Calendar from './pages/Calendar';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Certificates from './pages/Certificates';
import Grades from './pages/Grades';
import Booking from './pages/Booking';
import RoomBooking from './pages/RoomBooking';
import CourseFiles from './pages/CourseFiles';
import AdminPanel from './pages/AdminPanel';
import PracticalRegistrations from './pages/PracticalRegistrations';
import Layout from './components/Layout';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/modules"
            element={
              <PrivateRoute>
                <Layout>
                  <Modules />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/module/:moduleId"
            element={
              <PrivateRoute>
                <Layout>
                  <Modules />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/video/:videoId"
            element={
              <PrivateRoute>
                <Layout>
                  <VideoPlayer />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/quiz/:quizId"
            element={
              <PrivateRoute>
                <Layout>
                  <Quiz />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/exams"
            element={
              <PrivateRoute>
                <Layout>
                  <ExamRegistration />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/my-exams"
            element={
              <PrivateRoute>
                <Layout>
                  <MyExams />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <Layout>
                  <Analytics />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/evaluation/:moduleId"
            element={
              <PrivateRoute>
                <Layout>
                  <Evaluation />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/assignments"
            element={
              <PrivateRoute>
                <Layout>
                  <Assignments />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/assignments/module/:moduleId"
            element={
              <PrivateRoute>
                <Layout>
                  <Assignments />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <PrivateRoute>
                <Layout>
                  <Announcements />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <PrivateRoute>
                <Layout>
                  <Calendar />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <Layout>
                  <Notifications />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <PrivateRoute>
                <Layout>
                  <Messages />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/certificates"
            element={
              <PrivateRoute>
                <Layout>
                  <Certificates />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/grades"
            element={
              <PrivateRoute>
                <Layout>
                  <Grades />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/booking"
            element={
              <PrivateRoute>
                <Layout>
                  <Booking />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/room-booking"
            element={
              <PrivateRoute>
                <Layout>
                  <RoomBooking />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/files/module/:moduleId"
            element={
              <PrivateRoute>
                <Layout>
                  <CourseFiles />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Layout>
                  <AdminPanel />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/practical-registrations"
            element={
              <PrivateRoute>
                <Layout>
                  <PracticalRegistrations />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

