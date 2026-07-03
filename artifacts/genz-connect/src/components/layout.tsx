import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <header className="fixed top-0 inset-x-0 z-50 glass-panel border-b border-border/40 transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl md:text-2xl font-serif font-bold text-foreground hover:opacity-80 transition-opacity flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shadow-primary/20">
              <span className="text-white text-sm font-sans font-bold tracking-tighter">GC</span>
            </div>
            <span>LNCT GenZ Connect</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/browse" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Browse
            </Link>
            <Link href="/my-activity" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              My Activity
            </Link>
            <Button asChild className="rounded-full shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30 transition-all hover:-translate-y-0.5 font-medium px-5">
              <Link href="/post">Post Anonymously</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col pt-16">
        {children}
      </main>
    </div>
  );
}