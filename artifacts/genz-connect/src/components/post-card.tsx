import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Users, Code, BookOpen, Home, Lightbulb, HelpCircle, Eye, MessageCircle } from "lucide-react";
import type { Post } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  find_friends: Users,
  hackathon_team: Code,
  study_group: BookOpen,
  roommate: Home,
  project_collab: Lightbulb,
  other: HelpCircle,
};

const CATEGORY_LABELS: Record<string, string> = {
  find_friends: "Find Friends",
  hackathon_team: "Hackathon Team",
  study_group: "Study Group",
  roommate: "Roommate",
  project_collab: "Project Collab",
  other: "Other",
};

const URGENCY_CONFIG: Record<string, { label: string, className: string }> = {
  casual: { label: "Casual", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none" },
  urgent: { label: "Urgent", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-none animate-pulse" },
  looking_for_long_term: { label: "Long Term", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none" },
};

export function PostCard({ post, index = 0 }: { post: Post, index?: number }) {
  const Icon = CATEGORY_ICONS[post.category] || HelpCircle;
  const images = (post as any).imageUrls && (post as any).imageUrls.length 
    ? (post as any).imageUrls 
    : (post.imageUrl ? [post.imageUrl] : []);

  const renderImageGrid = () => {
    if (!images || images.length === 0) return null;
    if (images.length === 1) {
      return (
        <div className="h-44 w-full overflow-hidden border-b border-border/40 relative">
          <img src={images[0]} alt="Post media" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out" />
        </div>
      );
    }
    if (images.length === 2) {
      return (
        <div className="h-44 w-full grid grid-cols-2 gap-1 border-b border-border/40 overflow-hidden relative">
          <img src={images[0]} alt="Post media 1" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out" />
          <img src={images[1]} alt="Post media 2" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out" />
        </div>
      );
    }
    return (
      <div className="h-44 w-full grid grid-cols-3 gap-1 border-b border-border/40 overflow-hidden relative">
        <div className="col-span-2 h-full">
          <img src={images[0]} alt="Post media 1" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out" />
        </div>
        <div className="grid grid-rows-2 gap-1 h-full">
          <img src={images[1]} alt="Post media 2" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out" />
          <img src={images[2]} alt="Post media 3" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out" />
        </div>
      </div>
    );
  };

  return (
    <Card className={`glass-card hover-elevate overflow-hidden group flex flex-col h-full border-primary/5 rounded-3xl animate-fade-in-up stagger-${(index % 6) + 1} opacity-0`}>
      <Link href={`/posts/${post.id}`} className="flex flex-col h-full">
        {renderImageGrid()}
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="flex items-center gap-1.5 bg-primary/10 text-primary border-none font-bold px-2.5 py-1 rounded-full transition-colors text-[11px] uppercase tracking-wide">
              <Icon className="w-3.5 h-3.5" />
              {CATEGORY_LABELS[post.category] || post.category}
            </Badge>
            <div className="flex items-center gap-2">
              {post.urgency && URGENCY_CONFIG[post.urgency] && (
                <Badge variant="outline" className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${URGENCY_CONFIG[post.urgency].className}`}>
                  {URGENCY_CONFIG[post.urgency].label}
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground font-semibold">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          <CardTitle className="text-lg md:text-xl font-serif font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors text-foreground">{post.title}</CardTitle>
          <CardDescription className="text-xs font-semibold text-muted-foreground mt-2 flex items-center gap-1.5 bg-muted/40 px-2.5 py-1.5 rounded-xl w-fit border border-border/20">
            <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
              {post.alias.charAt(0).toUpperCase()}
            </span>
            {post.alias}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4 px-5 flex-1">
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">{post.description}</p>
          {post.skills && post.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4">
              {post.skills.slice(0, 3).map((skill: string) => (
                <span key={skill} className="text-[11px] px-2.5 py-1 bg-secondary text-primary font-bold rounded-lg border border-primary/5">
                  #{skill}
                </span>
              ))}
              {post.skills.length > 3 && (
                <span className="text-[11px] px-2.5 py-1 bg-muted text-muted-foreground font-bold rounded-lg border border-border/30">
                  +{post.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-3 pb-4 px-5 flex flex-col gap-3 border-t border-border/20 bg-muted/5 mt-auto">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1 hover:text-primary transition-colors">
                <Eye className="w-3.5 h-3.5 opacity-80" />
                {post.viewCount} views
              </span>
              <span className="flex items-center gap-1 hover:text-primary transition-colors">
                <MessageCircle className="w-3.5 h-3.5 opacity-80" />
                {post.requestCount} requests
              </span>
            </div>
            <span className="text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Connect &rarr;
            </span>
          </div>
          <div className="text-[9px] text-muted-foreground/70 font-medium text-center w-full border-t border-border/10 pt-2 flex items-center justify-center gap-1">
            🔒 Identity remains anonymous until admin approval
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
}