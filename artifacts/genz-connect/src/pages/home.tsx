import { Layout } from "@/components/layout";
import { Link, useLocation } from "wouter";
import { useListTrendingPosts, useListCategories } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

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
      <div className="mesh-bg border-b border-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[100px] pointer-events-none"></div>
        <div className="container mx-auto px-4 py-24 md:py-32 text-center max-w-4xl relative z-10 animate-fade-in-up">
          <Badge className="mb-6 bg-white/60 dark:bg-black/40 backdrop-blur-md text-primary border border-primary/20 px-4 py-1.5 text-sm font-semibold tracking-wide rounded-full shadow-sm">
            LNCT's Anonymous Safety Net
          </Badge>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 text-foreground tracking-tight text-balance leading-tight">
            Find your people. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Anonymously.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
            Whether you need a hackathon team, a study buddy, or just someone to grab lunch with — post what you need without revealing who you are. We'll connect you safely.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="rounded-full h-14 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all font-semibold w-full sm:w-auto">
              <Link href="/post">Post Anonymously</Link>
            </Button>
            <form onSubmit={handleSearch} className="relative w-full sm:w-auto max-w-sm group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
              <Input 
                type="text" 
                placeholder="Search posts..." 
                className="pl-12 h-14 rounded-full bg-white/70 dark:bg-black/40 backdrop-blur-md border-border focus-ring shadow-sm font-medium w-full md:w-80"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 py-20 border-b border-border/40">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <h2 className="text-3xl font-serif font-bold tracking-tight">Browse by Category</h2>
          <Button variant="ghost" className="rounded-full hover:bg-primary/5 hover:text-primary font-medium" asChild>
            <Link href="/browse">View All &rarr;</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories?.map((cat, i) => (
            <Link key={cat.slug} href={`/browse?category=${cat.slug}`} className={`glass-card flex flex-col items-center justify-center p-6 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all text-center gap-3 animate-fade-in-up stagger-${(i % 6) + 1} opacity-0 hover:-translate-y-1`}>
              <span className="font-semibold text-sm tracking-wide text-foreground/90">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Posts */}
      <div className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold font-serif mb-4 tracking-tight">Trending right now</h2>
          <p className="text-lg text-muted-foreground">What students are looking for on campus today.</p>
        </div>
        
        {postsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`h-[280px] bg-secondary/50 animate-pulse rounded-2xl border border-border/40 stagger-${(i % 6) + 1}`}></div>
            ))}
          </div>
        ) : trendingPosts?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingPosts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel rounded-3xl max-w-2xl mx-auto">
            <p className="text-lg text-muted-foreground font-medium">No trending posts right now. Be the first!</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Badge({ children, className, ...props }: any) {
  return <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props}>{children}</div>;
}