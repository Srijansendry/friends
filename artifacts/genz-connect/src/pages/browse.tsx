import { Layout } from "@/components/layout";
import { useListPosts, useListCategories } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Search, Loader2, SlidersHorizontal } from "lucide-react";
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
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
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
      <div className="mesh-bg border-b border-border/40 py-12 relative">
        <div className="absolute inset-0 bg-background/40 backdrop-blur-[50px] pointer-events-none"></div>
        <div className="container mx-auto px-4 relative z-10 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-8 tracking-tight">Browse Posts</h1>
          
          <div className="flex flex-col md:flex-row gap-4 bg-card/60 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-sm">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search by keywords or topics..."
                className="pl-12 h-12 bg-background border-border/50 focus-ring rounded-xl text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[200px] h-12 bg-background border-border/50 focus-ring rounded-xl font-medium">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="All Categories" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 shadow-lg">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map(cat => (
                    <SelectItem key={cat.slug} value={cat.slug}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-full sm:w-[160px] h-12 bg-background border-border/50 focus-ring rounded-xl font-medium">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 shadow-lg">
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex-1">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`h-[280px] bg-secondary/50 animate-pulse rounded-2xl border border-border/40 stagger-${(i % 6) + 1}`}></div>
            ))}
          </div>
        ) : posts?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post as any} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 glass-panel rounded-3xl max-w-2xl mx-auto animate-fade-in-up">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-serif font-bold mb-2">No posts found</h3>
            <p className="text-muted-foreground mb-8 text-lg">Try adjusting your filters or search terms.</p>
            <Button variant="outline" className="rounded-full px-8 h-12 font-medium" onClick={() => { setSearch(""); setCategory("all"); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}