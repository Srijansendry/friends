import { Layout } from "@/components/layout";
import { Link, useLocation } from "wouter";
import { useListTrendingPosts, useListCategories } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Flame, Users, Code, BookOpen, Home as HomeIcon, Lightbulb, HelpCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  find_friends: Users,
  hackathon_team: Code,
  study_group: BookOpen,
  roommate: HomeIcon,
  project_collab: Lightbulb,
  other: HelpCircle,
};

export function Home() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: trendingPosts, isLoading: postsLoading } = useListTrendingPosts({ limit: 6 });
  const { data: categories } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(search.trim())}`);
    } else {
      setLocation(`/browse`);
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="mesh-bg border-b border-primary/10 relative overflow-hidden py-16 md:py-28">
        {/* Subtle grid watermark */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-10 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 text-center max-w-4xl relative z-10 animate-fade-in-up">
          <Badge className="mb-6 bg-primary/10 text-primary border-none hover:bg-primary/20 px-4 py-1.5 text-xs font-extrabold tracking-widest uppercase rounded-full shadow-sm">
            ✨ LNCT's Anonymous Campus platform
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-black mb-6 text-foreground tracking-tight leading-[1.1] text-balance">
            Find your people at LNCT — <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-primary/60">anonymously.</span>
          </h1>
          
          <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed text-balance font-medium">
            Post, browse, and connect safely for friends, hackathon teams, study partners, confessions, and college help. Your identity remains hidden until you approve!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
            <Button asChild size="lg" className="rounded-full h-14 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all font-bold w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 text-white border-none">
              <Link href="/post">Post Anonymously</Link>
            </Button>
            
            <form onSubmit={handleSearch} className="relative w-full sm:flex-1 group">
              <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
              <Input 
                type="text" 
                placeholder="Search posts..." 
                className="pl-12 pr-4 h-14 rounded-full bg-card border-primary/20 focus-ring shadow-sm font-medium w-full text-base text-foreground placeholder:text-muted-foreground/60"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-16 border-b border-border/20 relative">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-3">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground flex items-center justify-center md:justify-start gap-2">
              Browse Categories
            </h2>
            <p className="text-sm text-muted-foreground font-semibold mt-1">Filter posts by what you are looking for</p>
          </div>
          <Button variant="ghost" className="rounded-full hover:bg-primary/5 hover:text-primary font-bold text-sm tracking-wide text-primary" asChild>
            <Link href="/browse" className="flex items-center gap-1">View All Posts <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories?.map((cat, i) => {
            const CatIcon = CATEGORY_ICONS[cat.slug] || HelpCircle;
            return (
              <Link key={cat.slug} href={`/browse?category=${cat.slug}`} className={`glass-card flex flex-col items-center justify-center p-6 rounded-3xl hover:border-primary/30 hover:bg-primary/[0.02] transition-all text-center gap-3.5 animate-fade-in-up stagger-${(i % 6) + 1} opacity-0 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5`}>
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <CatIcon className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="font-bold text-[13px] tracking-wide text-foreground/90">{cat.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Trending Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-red-500/5 text-red-500 border border-red-500/10 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-3">
            <Flame className="w-3.5 h-3.5 animate-pulse" /> Trending posts
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground tracking-tight">Active on Campus Right Now</h2>
          <p className="text-sm md:text-base text-muted-foreground font-semibold mt-2">Find a match and request to connect instantly</p>
        </div>
        
        {postsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`h-[320px] bg-muted/40 animate-pulse rounded-3xl border border-border/30 stagger-${(i % 6) + 1}`}></div>
            ))}
          </div>
        ) : trendingPosts?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingPosts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel rounded-3xl max-w-lg mx-auto p-8 border-primary/5">
            <Sparkles className="w-10 h-10 text-primary/30 mx-auto mb-4" />
            <p className="text-base text-muted-foreground font-bold">No trending posts right now.</p>
            <p className="text-xs text-muted-foreground/80 mt-1">Be the first to post what you are looking for!</p>
            <Button asChild className="rounded-full mt-5 font-bold bg-primary text-white border-none shadow-md shadow-primary/20">
              <Link href="/post">Create a Post</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}