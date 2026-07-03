import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Compass, Plus, Inbox, Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 opacity-50" disabled>
        <span className="w-4 h-4 rounded-full bg-muted animate-pulse" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full w-9 h-9 hover:bg-primary/10 hover:text-primary transition-all duration-300 relative overflow-hidden group"
      aria-label="Toggle theme"
    >
      <Sun className="w-[18px] h-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground group-hover:text-primary" />
      <Moon className="absolute w-[18px] h-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground group-hover:text-primary" />
    </Button>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [broadcast, setBroadcast] = useState<string | null>(null);

  useEffect(() => {
    const msg = localStorage.getItem("gc-broadcast-msg");
    if (msg && msg.trim()) {
      setBroadcast(msg);
    }
  }, []);

  const isHomeActive = location === "/";
  const isBrowseActive = location.startsWith("/browse") || (location.startsWith("/posts") && location !== "/post");
  const isPostActive = location === "/post";
  const isActivityActive = location === "/my-activity";

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      
      {/* Decorative floating blobs for cute GenZ college vibe */}
      <div className="absolute top-24 left-10 w-72 h-72 bg-primary/5 rounded-full blur-[80px] pointer-events-none -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-24 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      
      {/* Subtle background branding/watermark */}
      <div className="absolute top-[20%] right-[-100px] text-[120px] font-serif font-black text-primary/[0.015] select-none pointer-events-none -z-10 rotate-12 hidden lg:block">
        LNCT GenZ Connect
      </div>
      <div className="absolute bottom-[20%] left-[-150px] text-[120px] font-serif font-black text-primary/[0.015] select-none pointer-events-none -z-10 -rotate-12 hidden lg:block">
        LNCT GenZ Connect
      </div>
 
      {/* Sticky Compact Header */}
      <header className="fixed top-0 inset-x-0 z-50 glass-panel transition-all duration-300">
        {broadcast && (
          <div className="bg-gradient-to-r from-rose-500 via-primary to-violet-600 text-white py-1.5 px-4 text-center text-[10px] md:text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 relative">
            <span className="animate-pulse">📣</span> {broadcast}
            <button onClick={() => setBroadcast(null)} className="absolute right-3 hover:opacity-80 font-bold focus:outline-none text-sm leading-none">×</button>
          </div>
        )}
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-serif font-bold text-foreground hover:opacity-90 transition-opacity flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="text-white w-4.5 h-4.5" />
            </div>
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">LNCT GenZ Connect</span>
          </Link>
          <nav className="flex items-center gap-4 md:gap-6">
            <Link href="/browse" className={`text-sm font-semibold transition-all duration-200 hidden md:block hover:text-primary ${
              isBrowseActive ? "text-primary scale-105" : "text-muted-foreground"
            }`}>
              Browse
            </Link>
            <Link href="/my-activity" className={`text-sm font-semibold transition-all duration-200 hidden md:block hover:text-primary ${
              isActivityActive ? "text-primary scale-105" : "text-muted-foreground"
            }`}>
              My Activity
            </Link>
            <ThemeToggle />
            <Button asChild className="rounded-full shadow-md shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 font-semibold px-6 bg-gradient-to-r from-primary to-primary/95 text-white border-none h-10 hidden md:flex">
              <Link href="/post">Post Anonymously</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-16 pb-20 md:pb-0">
        {children}
      </main>

      {/* Discreet Premium Footer */}
      <footer className="bg-muted/5 border-t border-border/20 py-8 pb-28 md:pb-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-muted-foreground/60">
          <div>
            &copy; {new Date().getFullYear()} LNCT GenZ Connect.
          </div>
          <div className="flex gap-6">
            <Link href="/browse" className="hover:text-primary transition-colors">Browse</Link>
            <Link href="/my-activity" className="hover:text-primary transition-colors">Activity</Link>
            <Link href="/admin/login" className="hover:text-primary transition-colors flex items-center gap-1">
              🔑 Admin Portal
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-border/40 shadow-[0_-4px_24px_rgba(216,92,138,0.04)] px-6 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex flex-col items-center gap-1 flex-1 py-1 transition-transform active:scale-95">
          <Home className={`w-5 h-5 transition-colors ${isHomeActive ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-[10px] font-bold tracking-wide transition-colors ${isHomeActive ? "text-primary font-bold" : "text-muted-foreground font-medium"}`}>Home</span>
        </Link>

        <Link href="/browse" className="flex flex-col items-center gap-1 flex-1 py-1 transition-transform active:scale-95">
          <Compass className={`w-5 h-5 transition-colors ${isBrowseActive ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-[10px] font-bold tracking-wide transition-colors ${isBrowseActive ? "text-primary font-bold" : "text-muted-foreground font-medium"}`}>Browse</span>
        </Link>

        <Link href="/post" className="flex flex-col items-center justify-center flex-1 py-1 transition-transform active:scale-95 -translate-y-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 border-4 border-background text-white">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <span className="text-[10px] font-bold tracking-wide text-primary mt-1">Post</span>
        </Link>

        <Link href="/my-activity" className="flex flex-col items-center gap-1 flex-1 py-1 transition-transform active:scale-95">
          <Inbox className={`w-5 h-5 transition-colors ${isActivityActive ? "text-primary" : "text-muted-foreground"}`} />
          <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActivityActive ? "text-primary font-bold" : "text-muted-foreground font-medium"}`}>Activity</span>
        </Link>
      </div>

    </div>
  );
}