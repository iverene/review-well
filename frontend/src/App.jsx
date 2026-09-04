import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { Skeleton } from './components/common/Skeleton'

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'))
const Reviewer = lazy(() => import('./pages/Reviewer'))
const ReviewerList = lazy(() => import('./pages/ReviewerList'))
const Create = lazy(() => import('./pages/Create'))
const Review = lazy(() => import('./pages/Review'))
const Login = lazy(() => import('./pages/Login'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const Workspace = lazy(() => import('./pages/Workspace'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const About = lazy(() => import('./pages/About'))
const Guide = lazy(() => import('./pages/Guide'))
const Contact = lazy(() => import('./pages/Contact'))
const FindFriends = lazy(() => import('./pages/FindFriends'))
const Followers = lazy(() => import('./pages/Followers'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))

// Loading component
const PageLoader = () => (
  <div className="mx-auto min-h-screen max-w-6xl space-y-6 px-4 py-20 md:px-8" role="status" aria-label="Loading page">
    <Skeleton className="h-10 w-56" />
    <Skeleton className="h-48 w-full" />
    <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
  </div>
)

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/about" element={<About />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route path="/reviewer/my" element={<ProtectedRoute><ReviewerList mine /></ProtectedRoute>} />
              <Route path="/reviewer/public" element={<ReviewerList />} />
              <Route path="/reviewer/:id" element={<Reviewer />} />
              <Route
                path="/workspace/:id"
                element={
                  <ProtectedRoute>
                    <Workspace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <Create />
                  </ProtectedRoute>
                }
              />
              <Route path="/review/:id" element={<Review />} />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route
                path="/profile/:userId/followers"
                element={
                  <ProtectedRoute>
                    <Followers type="followers" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:userId/following"
                element={
                  <ProtectedRoute>
                    <Followers type="following" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/friends"
                element={
                  <ProtectedRoute>
                    <FindFriends />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Layout>
      </AuthProvider>
    </Router>
  )
}

export default App
