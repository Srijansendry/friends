import { Layout } from "@/components/layout";
import { useEffect, useState } from "react";
import { getTokensHeader, getTokens } from "@/lib/token";
import type { MyPost, MyRequest } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Inbox, ArrowRight, MessageSquareText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export function MyActivity() {
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
      <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl animate-fade-in-up">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight">My Activity</h1>
          <p className="text-lg text-muted-foreground">Manage your anonymous posts and connection requests securely.</p>
        </div>

        {tokens.length === 0 ? (
          <div className="text-center py-24 glass-panel rounded-3xl animate-fade-in-up">
            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Inbox className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-serif font-bold mb-3">No activity yet</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto text-balance">
              You haven't made any posts or sent any connection requests from this browser yet.
            </p>
            <Link href="/post" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 shadow-lg shadow-primary/20 transition-all h-14 px-10 inline-flex items-center justify-center rounded-full font-semibold text-base">
              Create a Post
            </Link>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="mb-8 p-1.5 bg-muted/40 backdrop-blur-md rounded-xl w-full sm:w-auto inline-flex border border-border/50">
              <TabsTrigger value="posts" className="flex-1 sm:px-10 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold text-base transition-all">
                My Posts ({myPosts.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex-1 sm:px-10 py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-semibold text-base transition-all">
                My Requests ({myRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              {myPosts.length === 0 ? (
                <div className="text-center py-16 glass-panel rounded-2xl">
                  <p className="text-lg text-muted-foreground font-medium">No posts created.</p>
                </div>
              ) : (
                myPosts.map((post, i) => (
                  <Card key={post.id} className={`glass-card border-border/50 overflow-hidden animate-fade-in-up stagger-${(i % 6) + 1} opacity-0 rounded-2xl`}>
                    <CardHeader className="bg-muted/10 border-b border-border/40 pb-5">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-3 py-1 font-semibold">
                          {post.category}
                        </Badge>
                        <Badge variant={post.status === "active" ? "default" : "secondary"} className="shadow-sm">
                          {post.status.toUpperCase()}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl font-serif mt-2">{post.title}</CardTitle>
                      <CardDescription className="text-sm font-medium mt-1">
                        Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-lg mb-5 flex items-center gap-2.5">
                        <div className="p-1.5 bg-primary/10 rounded-md">
                          <Inbox className="w-5 h-5 text-primary" />
                        </div>
                        Incoming Requests ({post.incomingRequests?.length || 0})
                      </h4>
                      
                      {post.incomingRequests?.length === 0 ? (
                        <p className="text-muted-foreground text-sm bg-muted/20 p-4 rounded-xl border border-dashed text-center">No requests yet.</p>
                      ) : (
                        <div className="space-y-5">
                          {post.incomingRequests.map(req => (
                            <div key={req.id} className="bg-background/60 p-5 rounded-xl border shadow-sm">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Request #{req.id}</span>
                                <Badge variant="outline" className="bg-background font-semibold">
                                  {req.status}
                                </Badge>
                              </div>
                              <p className="text-base text-foreground mb-4 bg-muted/30 p-4 rounded-lg border border-border/50 leading-relaxed">
                                "{req.message}"
                              </p>
                              
                              {req.messages && req.messages.length > 0 && (
                                <div className="mt-5 space-y-3 pl-5 border-l-[3px] border-primary/30 py-1">
                                  <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                    <MessageSquareText className="w-3.5 h-3.5" />
                                    Messages from Admin
                                  </span>
                                  {req.messages.filter(m => m.toParty === "poster").map(msg => (
                                    <div key={msg.id} className="bg-primary/5 p-4 rounded-lg text-sm text-foreground/90 font-medium leading-relaxed">
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
                <div className="text-center py-16 glass-panel rounded-2xl">
                  <p className="text-lg text-muted-foreground font-medium">No requests sent.</p>
                </div>
              ) : (
                myRequests.map((req, i) => (
                  <Card key={req.id} className={`glass-card border-border/50 overflow-hidden animate-fade-in-up stagger-${(i % 6) + 1} opacity-0 rounded-2xl`}>
                    <CardHeader className="bg-muted/10 border-b border-border/40 pb-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          Request for post: <Link href={`/posts/${req.postId}`} className="text-foreground font-semibold hover:text-primary hover:underline transition-all line-clamp-1 flex-1">{req.postTitle}</Link>
                        </span>
                        <Badge variant="outline" className={`font-semibold shadow-sm w-fit ${req.status === 'approved' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}`}>
                          {req.status.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm font-medium">
                        Sent {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="mb-5">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 block">Your Message</span>
                        <p className="text-base text-foreground bg-muted/30 p-4 rounded-lg border border-border/50 leading-relaxed">
                          {req.message}
                        </p>
                      </div>

                      {req.messages && req.messages.length > 0 && (
                        <div className="mt-6 space-y-3 pl-5 border-l-[3px] border-primary/30 py-1">
                          <span className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1.5 mb-3">
                            <MessageSquareText className="w-3.5 h-3.5" />
                            Messages from Admin
                          </span>
                          {req.messages.filter(m => m.toParty === "requester").map(msg => (
                            <div key={msg.id} className="bg-primary/5 p-4 rounded-lg text-sm text-foreground/90 font-medium leading-relaxed">
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