import { Layout } from "@/components/layout";
import { useEffect, useState } from "react";
import { getTokensHeader, getTokens } from "@/lib/token";
import type { MyPost, MyRequest } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Inbox, ArrowRight, MessageSquareText, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string, className: string }> = {
  pending: { label: "Pending Review", className: "bg-amber-500/10 text-amber-600 border-none" },
  approved: { label: "Approved 🎉", className: "bg-emerald-500/10 text-emerald-600 border-none" },
  rejected: { label: "Declined", className: "bg-red-500/10 text-red-600 border-none" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-none" },
};

export function MyActivity() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const tokens = getTokens();

  useEffect(() => {
    const fetchData = async () => {
      if (tokens.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const headers = getTokensHeader();
        const [postsRes, reqsRes] = await Promise.all([
          fetch("/api/me/posts", { headers }),
          fetch("/api/me/requests", { headers })
        ]);
        if (postsRes.ok) {
          setMyPosts(await postsRes.json());
        }
        if (reqsRes.ok) {
          setMyRequests(await reqsRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl animate-fade-in-up">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-serif font-black text-foreground tracking-tight">My Activity</h1>
          <p className="text-sm md:text-base text-muted-foreground font-semibold mt-1">Manage your anonymous posts, connection requests, and admin handshakes.</p>
        </div>

        {tokens.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-3xl max-w-lg mx-auto p-8 border-primary/5">
            <div className="w-16 h-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Inbox className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">No activity yet</h3>
            <p className="text-muted-foreground text-sm font-semibold max-w-xs mx-auto mb-8">
              Posts you create and connection requests you send from this browser will show up here.
            </p>
            <Button asChild size="lg" className="rounded-full font-bold bg-primary text-white border-none shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all">
              <Link href="/post">Create your first post</Link>
            </Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="mb-8 p-1 bg-muted/40 backdrop-blur-md rounded-2xl w-full flex border border-border/30">
              <TabsTrigger value="posts" className="flex-1 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs font-extrabold uppercase tracking-widest text-muted-foreground transition-all">
                My Posts ({myPosts.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex-1 py-3 rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs font-extrabold uppercase tracking-widest text-muted-foreground transition-all">
                My Requests ({myRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              {myPosts.length === 0 ? (
                <div className="text-center py-16 glass-panel rounded-3xl p-6 border-primary/5">
                  <p className="text-sm text-muted-foreground font-bold">No posts created yet.</p>
                  <Button asChild variant="outline" className="rounded-full mt-4 border-primary/20 text-primary hover:bg-primary/5 text-xs font-bold uppercase tracking-wider">
                    <Link href="/post">Create a Post</Link>
                  </Button>
                </div>
              ) : (
                myPosts.map((post, i) => (
                  <Card key={post.id} className={`glass-card border-primary/5 overflow-hidden rounded-3xl animate-fade-in-up stagger-${(i % 6) + 1} opacity-0`}>
                    <CardHeader className="bg-muted/5 border-b border-border/20 pb-5 px-6 pt-6">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
                          {post.category.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant="secondary" className={`shadow-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          post.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                        }`}>
                          {post.status.toUpperCase()}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl md:text-2xl font-serif font-bold text-foreground mt-3 leading-snug">{post.title}</CardTitle>
                      <CardDescription className="text-xs font-semibold text-muted-foreground mt-1">
                        Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <h4 className="font-extrabold text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-primary" />
                        Incoming Requests ({post.incomingRequests?.length || 0})
                      </h4>
                      
                      {post.incomingRequests?.length === 0 ? (
                        <p className="text-muted-foreground text-xs bg-muted/10 p-5 rounded-2xl border border-dashed border-border/50 text-center font-semibold">No connection requests yet. We'll alert you here when someone requests to connect!</p>
                      ) : (
                        <div className="space-y-4">
                          {post.incomingRequests.map(req => (
                            <div key={req.id} className="bg-muted/10 p-5 rounded-2xl border border-border/30 relative">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Request #{req.id}</span>
                                {req.status && STATUS_CONFIG[req.status] && (
                                  <Badge variant="outline" className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${STATUS_CONFIG[req.status].className}`}>
                                    {STATUS_CONFIG[req.status].label}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-foreground/90 bg-card p-4 rounded-xl border border-border/25 leading-relaxed italic mb-4">
                                "{req.message}"
                              </p>
                              
                              {/* Handshake instructions if request is approved */}
                              {req.status === "approved" && (
                                <div className="mt-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs flex gap-2.5 items-start">
                                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <div className="space-y-1">
                                    <p className="font-bold text-emerald-800 dark:text-emerald-300">Connection Approved!</p>
                                    <p className="text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
                                      The admin has approved this connection. Check the admin messages below for the requester's contact handle.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {req.messages && req.messages.length > 0 && (
                                <div className="mt-4 space-y-2.5 pl-4 border-l-2 border-primary/20 py-0.5">
                                  <span className="text-[9px] font-extrabold text-primary uppercase tracking-widest flex items-center gap-1">
                                    <MessageSquareText className="w-3 h-3" />
                                    Messages from Admin
                                  </span>
                                  {req.messages.filter(m => m.toParty === "poster").map(msg => (
                                    <div key={msg.id} className="bg-card p-3 rounded-xl text-xs text-foreground/90 font-semibold leading-relaxed border border-border/20">
                                      {msg.body}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-6">
              {myRequests.length === 0 ? (
                <div className="text-center py-16 glass-panel rounded-3xl p-6 border-primary/5">
                  <p className="text-sm text-muted-foreground font-bold">No requests sent yet.</p>
                  <Button asChild variant="outline" className="rounded-full mt-4 border-primary/20 text-primary hover:bg-primary/5 text-xs font-bold uppercase tracking-wider">
                    <Link href="/browse">Browse Posts</Link>
                  </Button>
                </div>
              ) : (
                myRequests.map((req, i) => (
                  <Card key={req.id} className={`glass-card border-primary/5 overflow-hidden rounded-3xl animate-fade-in-up stagger-${(i % 6) + 1} opacity-0`}>
                    <CardHeader className="bg-muted/5 border-b border-border/20 pb-5 px-6 pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          Request for: <Link href={`/posts/${req.postId}`} className="text-foreground font-bold hover:text-primary hover:underline transition-all line-clamp-1 flex-1 font-serif">{req.postTitle}</Link>
                        </span>
                        {req.status && STATUS_CONFIG[req.status] && (
                          <Badge variant="outline" className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${STATUS_CONFIG[req.status].className}`}>
                            {STATUS_CONFIG[req.status].label}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs font-semibold text-muted-foreground mt-2">
                        Sent {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest mb-2 block">Your Message</span>
                        <p className="text-sm text-foreground/90 bg-muted/10 p-4 rounded-xl border border-border/30 leading-relaxed italic">
                          "{req.message}"
                        </p>
                      </div>

                      {/* Handshake instructions if request is approved */}
                      {req.status === "approved" && (
                        <div className="mb-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs flex gap-2.5 items-start">
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-bold text-emerald-800 dark:text-emerald-300">Connection Approved!</p>
                            <p className="text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
                              Admins have approved your request! Check the admin messages below for how to reach out to the author.
                            </p>
                          </div>
                        </div>
                      )}

                      {req.messages && req.messages.length > 0 && (
                        <div className="mt-5 space-y-2.5 pl-4 border-l-2 border-primary/20 py-0.5">
                          <span className="text-[9px] font-extrabold text-primary uppercase tracking-widest flex items-center gap-1">
                            <MessageSquareText className="w-3 h-3" />
                            Messages from Admin
                          </span>
                          {req.messages.filter(m => m.toParty === "requester").map(msg => (
                            <div key={msg.id} className="bg-card p-3 rounded-xl text-xs text-foreground/90 font-semibold leading-relaxed border border-border/20">
                              {msg.body}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}