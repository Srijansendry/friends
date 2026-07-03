import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { ThemeProvider } from "next-themes";

import { Home } from "@/pages/home";
import { Browse } from "@/pages/browse";
import { Post } from "@/pages/post";
import { PostDetail } from "@/pages/post-detail";
import { MyActivity } from "@/pages/my-activity";
import { AdminLogin } from "@/pages/admin-login";
import { AdminDashboard } from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/post" component={Post} />
              <Route path="/browse" component={Browse} />
              <Route path="/posts/:id" component={(params) => <PostDetail id={params.params.id} />} />
              <Route path="/my-activity" component={MyActivity} />
              <Route path="/admin/login" component={AdminLogin} />
              <Route path="/admin" component={AdminDashboard} />
              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
