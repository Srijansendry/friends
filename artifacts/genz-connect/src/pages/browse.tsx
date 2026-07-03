import { Layout } from "@/components/layout";
import { useListPosts, useListCategories } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Search, Loader2, SlidersHorizontal, Sparkles, Filter } from "lucide-react";
import { useLocation } from "wouter";

export function Browse() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState<any>(searchParams.get("category") || "all");
  const [sort, setSort] = useState<any>("recent");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categories } = useListCategories();
  const { data: posts, isLoading } = useListPosts({
    search: debouncedSearch || undefined,
    category: category !== "all" ? category : undefined,
    sort: sort,
  });

  return (
    <Layout>
      {/* Search and Filters Header */}
      <div className="mesh-bg border-b border-border/20 py-10 md:py-16 relative">
        <div className="absolute inset-0 bg-background/30 backdrop-blur-[40px] pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10 animate-fade-in-up">
          <h1 className="text-3xl md:text-5xl font-serif font-black mb-6 text-foreground tracking-tight">Browse Posts</h1>
          
          <div className="space-y-4">
            {/* Search Input Bar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-card p-3 rounded-[24px] border border-primary/10 shadow-md shadow-primary/5">
              <div className="relative flex-1 group">
                <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="What are you looking for today? Try 'hackathon' or 'coffee'..."
                  className="pl-12 pr-4 h-12 bg-muted/30 border-none focus-ring rounded-xl text-base text-foreground placeholder:text-muted-foreground/50 shadow-inner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-full sm:w-[160px] h-12 bg-card border border-primary/10 focus-ring rounded-xl font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/40 shadow-xl">
                    <SelectItem value="recent" className="font-bold text-xs uppercase text-muted-foreground">Recent</SelectItem>
                    <SelectItem value="trending" className="font-bold text-xs uppercase text-muted-foreground">Trending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scrollable Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none select-none">
              <Button
                variant="outline"
                className={`rounded-full px-5 h-10 text-xs font-bold whitespace-nowrap transition-all border-primary/10 hover:-translate-y-0.5 duration-300 ${
                  category === "all" 
                    ? "bg-primary text-white border-none shadow-md shadow-primary/25" 
                    : "bg-card hover:bg-primary/5 hover:text-primary text-muted-foreground"
                }`}
                onClick={() => setCategory("all")}
              >
                All Posts
              </Button>
              {categories?.map((cat) => (
                <Button
                  key={cat.slug}
                  variant="outline"
                  className={`rounded-full px-5 h-10 text-xs font-bold whitespace-nowrap transition-all border-primary/10 hover:-translate-y-0.5 duration-300 ${
                    category === cat.slug 
                      ? "bg-primary text-white border-none shadow-md shadow-primary/25" 
                      : "bg-card hover:bg-primary/5 hover:text-primary text-muted-foreground"
                  }`}
                  onClick={() => setCategory(cat.slug)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Posts List container */}
      <div className="container mx-auto px-4 py-12 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`h-[320px] bg-muted/40 animate-pulse rounded-3xl border border-border/30 stagger-${(i % 6) + 1}`}></div>
            ))}
          </div>
        ) : posts?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post as any} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 glass-panel rounded-3xl max-w-lg mx-auto p-8 border-primary/5 animate-fade-in-up">
            <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-5 text-primary">
              <Sparkles className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">No posts found</h3>
            <p className="text-muted-foreground text-sm font-semibold max-w-xs mx-auto mb-6">We couldn't find any active posts matching your current filters.</p>
            <Button variant="outline" className="rounded-full px-6 h-11 text-xs font-bold uppercase tracking-wider border-primary/20 text-primary hover:bg-primary/5" onClick={() => { setSearch(""); setCategory("all"); }}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}