import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import RegisterAnnouncement from "@/pages/register-announcement";
import Announcements from "@/pages/announcements";
import MyQuestions from "@/pages/my-questions";
import KnowledgeSearch from "@/pages/knowledge-search";
import ReceivedQuestions from "@/pages/received-questions";
import ManageUsers from "@/pages/manage-users";
import ChatPage from "@/pages/chat";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/register-announcement" component={RegisterAnnouncement} />
      <ProtectedRoute path="/announcements" component={Announcements} />
      <ProtectedRoute path="/my-questions" component={MyQuestions} />
      <ProtectedRoute path="/knowledge-search" component={KnowledgeSearch} />
      <ProtectedRoute path="/received-questions" component={ReceivedQuestions} />
      <ProtectedRoute path="/manage-users" component={ManageUsers} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
