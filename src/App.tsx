import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
// @ts-ignore
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import Index from "./pages/Index";
import MentorDashboard from "./pages/MentorDashboard";
import MenteeDashboard from "./pages/MenteeDashboard";
import FindMentor from "./pages/FindMentor";
import BecomeMentor from "./pages/BecomeMentor";
import Categories from "./pages/Categories";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import MentorProfile from "./pages/MentorProfile";
import SessionRoom from "./pages/SessionRoom";
import AdminLayout from "./pages/admin/AdminLayout";
import Analytics from "./pages/admin/Analytics";
import Users from "./pages/admin/Users";
import Approvals from "./pages/admin/Approvals";
// import Payments from "./pages/admin/Payments";
import Reports from "./pages/admin/Reports";
import ReviewModeration from "./pages/admin/review-moderation";
import Reviews from "./pages/dashboard/reviews";
import Feedback from "./pages/dashboard/feedback";
import Achievements from "./pages/Achievements";
import TestAuthFlow from "./pages/test-auth-flow";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/find-mentor" element={<FindMentor />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/mentor/:mentorId" element={<MentorProfile />} />
              <Route path="/become-mentor" element={<BecomeMentor />} />

              {/* Protected Routes */}
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } />

              {/* User Profile Routes */}
              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <MentorProfile />
                </ProtectedRoute>
              } />

              {/* Role-Based Protected Routes with User ID */}
              <Route path="/mentor-dashboard/:userId" element={
                <ProtectedRoute roles={["mentor"]}>
                  <MentorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/mentee-dashboard/:userId" element={
                <ProtectedRoute roles={["mentee"]}>
                  <MenteeDashboard />
                </ProtectedRoute>
              } />

              {/* Legacy Dashboard Routes (for backward compatibility) */}
              <Route path="/dashboard/mentor" element={
                <ProtectedRoute roles={["mentor"]}>
                  <MentorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/mentee" element={
                <ProtectedRoute roles={["mentee"]}>
                  <MenteeDashboard />
                </ProtectedRoute>
              } />

              <Route path="/session/:bookingId" element={
                <ProtectedRoute>
                  <SessionRoom />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/reviews" element={
                <ProtectedRoute>
                  <Reviews />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/feedback/:bookingId?" element={
                <ProtectedRoute>
                  <Feedback />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/achievements" element={
                <ProtectedRoute>
                  <Achievements />
                </ProtectedRoute>
              } />

              {/* Test Route */}
              <Route path="/test-auth" element={
                <ProtectedRoute>
                  <TestAuthFlow />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Analytics />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="users" element={<Users />} />
                <Route path="approvals" element={<Approvals />} />
                {/* <Route path="payments" element={<Payments />} /> */}
                <Route path="reports" element={<Reports />} />
                <Route path="review-moderation" element={<ReviewModeration />} />
              </Route>

              {/* Catch-all Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
