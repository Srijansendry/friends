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

export function PostCard({ post, index = 0 }: { post: Post, index?: number }) {
  const Icon = CATEGORY_ICONS[post.category] || HelpCircle;

  return (
    <Card className={`glass-card hover-elevate overflow-hidden group flex flex-col h-full border-border/50 animate-fade-in-up stagger-${(index % 6) + 1} opacity-0`}>
      <Link href={`/posts/${post.id}`} className="flex flex-col h-full">
        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-none font-medium px-2.5 py-1 rounded-full transition-colors">
              <Icon className="w-3.5 h-3.5" />
              {CATEGORY_LABELS[post.category] || post.category}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
          <CardTitle className="text-xl font-serif leading-snug line-clamp-2 group-hover:text-primary transition-colors">{post.title}</CardTitle>
          <CardDescription className="text-sm font-medium text-foreground/70 mt-1.5 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground border border-border/50">
              {post.alias.charAt(0).toUpperCase()}
            </span>
            {post.alias}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4 px-5 flex-1">
          <p className="text-muted-foreground/90 line-clamp-3 text-sm leading-relaxed">{post.description}</p>
          {post.skills && post.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {post.skills.slice(0, 3).map((skill: string) => (
                <span key={skill} className="text-xs px-2.5 py-1 bg-secondary/50 rounded-md text-secondary-foreground/80 font-medium border border-border/40">
                  {skill}
                </span>
              ))}
              {post.skills.length > 3 && (
                <span className="text-xs px-2.5 py-1 bg-secondary/30 rounded-md text-secondary-foreground/60 font-medium border border-border/40">
                  +{post.skills.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-3 pb-4 px-5 flex items-center justify-between border-t border-border/30 bg-muted/10 mt-auto">
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5 group-hover:text-foreground transition-colors">
              <Eye className="w-3.5 h-3.5 opacity-70" />
              {post.viewCount}
            </span>
            <span className="flex items-center gap-1.5 group-hover:text-foreground transition-colors">
              <MessageCircle className="w-3.5 h-3.5 opacity-70" />
              {post.requestCount}
            </span>
          </div>
          <span className="text-primary font-medium text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            View &rarr;
          </span>
        </CardFooter>
      </Link>
    </Card>
  );
}