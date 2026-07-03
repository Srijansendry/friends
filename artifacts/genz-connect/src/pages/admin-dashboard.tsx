import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { 
  useGetAdminSession, 
  useGetAdminStats, 
  useListAdminPosts, 
  useListAdminRequests,
  useUpdateAdminPost,
  useApproveAdminRequest,
  useRejectAdminRequest,
  useSendAdminMessage,
  getListAdminPostsQueryKey,
  getListAdminRequestsQueryKey,
  useAdminLogout
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut, CheckCircle, XCircle, Send, MessageCircle, BarChart3, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: session, isLoading: sessionLoading, isError: sessionError } = useGetAdminSession();
  const { data: stats } = useGetAdminStats();
  
  const [postStatusFilter, setPostStatusFilter] = useState<string>("all");
  const [reqStatusFilter, setReqStatusFilter] = useState<string>("pending");
  
  const { data: posts, isLoading: postsLoading } = useListAdminPosts(
    postStatusFilter !== "all" ? { status: postStatusFilter as any } : {}
  );
  
  const { data: requests, isLoading: reqsLoading } = useListAdminRequests(
    reqStatusFilter !== "all" ? { status: reqStatusFilter as any } : {}
  );

  const updatePost = useUpdateAdminPost();
  const approveReq = useApproveAdminRequest();
  const rejectReq = useRejectAdminRequest();
  const sendMessage = useSendAdminMessage();
  const logout = useAdminLogout();

  const handleUpdatePostStatus = (id: number, status: "active" | "closed" | "removed") => {
    updatePost.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Post marked as ${status}` });
        queryClient.invalidateQueries({ queryKey: getListAdminPostsQueryKey() });
      }
    });
  };

  const handleApproveReq = (id: number) => {
    approveReq.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Request approved" });
        queryClient.invalidateQueries({ queryKey: getListAdminRequestsQueryKey() });
      }
    });
  };

  const handleRejectReq = (id: number) => {
    rejectReq.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Request rejected" });
        queryClient.invalidateQueries({ queryKey: getListAdminRequestsQueryKey() });
      }
    });
  };

  const [messageReqId, setMessageReqId] = useState<number | null>(null);
  const [messageToParty, setMessageToParty] = useState<"poster" | "requester">("poster");
  const [messageBody, setMessageBody] = useState("");

  const handleSendMessage = () => {
    if (!messageReqId || !messageBody.trim()) return;
    sendMessage.mutate({
      id: messageReqId,
      data: { toParty: messageToParty, body: messageBody }
    }, {
      onSuccess: () => {
        toast({ title: "Message sent securely" });
        setMessageBody("");
        setMessageReqId(null);
        queryClient.invalidateQueries({ queryKey: getListAdminRequestsQueryKey() });
      }
    });
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/admin/login");
      }
    });
  };

  if (sessionLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-foreground/50" />
        </div>
      </Layout>
    );
  }

  if (sessionError || !session?.authenticated) {
    setLocation("/admin/login");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-7xl animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 glass-panel p-6 rounded-3xl">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2 flex items-center gap-3">
              <Database className="w-8 h-8 text-foreground/50" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground font-medium">Manage the anonymous community safely and effectively.</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="rounded-full px-6 border-border/50 hover:bg-muted/50 font-semibold shadow-sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout Securely
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            <StatCard label="Total Posts" value={stats.totalPosts} />
            <StatCard label="Active Posts" value={stats.activePosts} />
            <StatCard label="Posts Today" value={stats.postsToday} />
            <StatCard label="Pending Reqs" value={stats.pendingRequests} highlight={stats.pendingRequests > 0} />
            <StatCard label="Approved Reqs" value={stats.approvedRequests} />
            <StatCard label="Removed Posts" value={stats.removedPosts} />
          </div>
        )}

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="mb-8 p-1.5 bg-muted/30 backdrop-blur-md rounded-xl w-full sm:w-auto inline-flex border border-border/50">
            <TabsTrigger value="requests" className="px-8 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-bold text-base transition-all">
              Connection Requests
            </TabsTrigger>
            <TabsTrigger value="posts" className="px-8 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-bold text-base transition-all">
              Manage Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/50 w-fit">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filter Status:</span>
              <Select value={reqStatusFilter} onValueChange={setReqStatusFilter}>
                <SelectTrigger className="w-[200px] bg-background border-border/50 focus-ring font-medium rounded-lg h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reqsLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-muted-foreground/50" /></div>
            ) : requests?.length === 0 ? (
              <div className="text-center py-24 glass-panel rounded-3xl animate-fade-in-up">
                <p className="text-lg text-muted-foreground font-medium">No requests found matching this filter.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {requests?.map((req, i) => (
                  <Card key={req.id} className={`glass-card border-border/50 animate-fade-in-up stagger-${(i % 5) + 1} opacity-0 overflow-hidden rounded-2xl`}>
                    <CardHeader className="bg-muted/10 pb-5 border-b border-border/40">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <Badge variant={req.status === 'pending' ? 'default' : req.status === 'approved' ? 'outline' : 'secondary'} className={`mb-3 text-xs font-bold tracking-widest px-3 py-1 ${req.status === 'approved' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}`}>
                            {req.status.toUpperCase()}
                          </Badge>
                          <CardTitle className="text-xl font-serif">Request #{req.id} for "{req.postTitle}"</CardTitle>
                          <CardDescription className="mt-2 text-sm font-medium leading-relaxed">
                            Target Post ID: {req.postId} &nbsp;•&nbsp; Category: {req.postCategory} &nbsp;•&nbsp; Poster Alias: <span className="font-bold text-foreground">{req.postAlias}</span>
                            <br/>
                            Requested {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                          </CardDescription>
                        </div>
                        {req.status === "pending" && (
                          <div className="flex gap-3">
                            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50/50 border-green-200 dark:border-green-900/30 rounded-full font-semibold px-4" onClick={() => handleApproveReq(req.id)}>
                              <CheckCircle className="w-4 h-4 mr-2" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50/50 border-red-200 dark:border-red-900/30 rounded-full font-semibold px-4" onClick={() => handleRejectReq(req.id)}>
                              <XCircle className="w-4 h-4 mr-2" /> Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2"><MessageCircle className="w-4 h-4"/> Requester's Message</h4>
                          <p className="bg-background/60 p-5 rounded-xl border border-border/50 text-base leading-relaxed whitespace-pre-wrap shadow-sm">
                            {req.message}
                          </p>
                          {req.contactNote && (
                            <div className="mt-4 bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                              <h4 className="text-xs font-bold uppercase tracking-widest text-blue-800 dark:text-blue-300 mb-2">Contact Note (Private)</h4>
                              <p className="text-base font-medium text-blue-900 dark:text-blue-200">{req.contactNote}</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-muted/10 p-5 rounded-xl border border-border/40">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Send className="w-4 h-4"/> Mediation Log</h4>
                            <Dialog open={messageReqId === req.id} onOpenChange={(open) => !open && setMessageReqId(null)}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="secondary" className="rounded-full shadow-sm font-semibold hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setMessageReqId(req.id)}>
                                  <MessageCircle className="w-4 h-4 mr-2" /> Message
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rounded-3xl border-border/50 p-8 sm:max-w-[500px]">
                                <DialogHeader className="mb-6">
                                  <DialogTitle className="text-2xl font-serif">Send Mediated Message</DialogTitle>
                                  <DialogDescription className="text-base mt-2">
                                    This message will appear in the user's secure "My Activity" tab.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-2">
                                  <div className="space-y-3">
                                    <label className="text-sm font-semibold">Recipient</label>
                                    <Select value={messageToParty} onValueChange={(v: any) => setMessageToParty(v)}>
                                      <SelectTrigger className="h-12 rounded-xl focus-ring bg-muted/30 font-medium">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="rounded-xl">
                                        <SelectItem value="poster">Original Poster ({req.postAlias})</SelectItem>
                                        <SelectItem value="requester">Requester</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-3">
                                    <label className="text-sm font-semibold">Message Body</label>
                                    <Textarea 
                                      value={messageBody} 
                                      onChange={e => setMessageBody(e.target.value)} 
                                      placeholder="E.g., The poster would like to connect! Their instagram is..." 
                                      rows={5}
                                      className="rounded-xl focus-ring bg-muted/30 text-base p-4 resize-none"
                                    />
                                  </div>
                                </div>
                                <DialogFooter className="mt-6">
                                  <Button size="lg" className="rounded-full w-full font-semibold shadow-lg" onClick={handleSendMessage} disabled={!messageBody.trim() || sendMessage.isPending}>
                                    {sendMessage.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                                    Send Safely
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          {req.messages?.length > 0 ? (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                              {req.messages.map(msg => (
                                <div key={msg.id} className="bg-background/80 border border-border/50 p-4 rounded-xl text-sm shadow-sm">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-primary">To: {msg.toParty}</span>
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {new Date(msg.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-foreground/90 font-medium leading-relaxed">{msg.body}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-muted-foreground text-center py-10 bg-background/40 rounded-xl border border-dashed border-border/50">
                              No messages sent yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/50 w-fit">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filter Status:</span>
              <Select value={postStatusFilter} onValueChange={setPostStatusFilter}>
                <SelectTrigger className="w-[200px] bg-background border-border/50 focus-ring font-medium rounded-lg h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="removed">Removed (Spam/Rule break)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {postsLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-muted-foreground/50" /></div>
            ) : posts?.length === 0 ? (
              <div className="text-center py-24 glass-panel rounded-3xl animate-fade-in-up">
                <p className="text-lg text-muted-foreground font-medium">No posts found matching this filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {posts?.map((post, i) => (
                  <Card key={post.id} className={`glass-card border-border/50 flex flex-col overflow-hidden rounded-2xl animate-fade-in-up stagger-${(i % 6) + 1} opacity-0`}>
                    <CardHeader className="pb-4 bg-muted/5 border-b border-border/30">
                      <div className="flex justify-between items-start mb-3">
                        <Badge variant="outline" className="font-semibold bg-background">{post.category}</Badge>
                        <Badge variant={post.status === "active" ? "default" : post.status === "removed" ? "destructive" : "secondary"} className="shadow-sm">
                          {post.status.toUpperCase()}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-serif leading-snug">{post.title}</CardTitle>
                      <CardDescription className="font-medium mt-2 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground border border-border/50">{post.alias.charAt(0).toUpperCase()}</span>
                        {post.alias} <span className="opacity-50">•</span> {post.viewCount} views
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 py-5">
                      <p className="text-sm text-muted-foreground/90 line-clamp-3 leading-relaxed">{post.description}</p>
                    </CardContent>
                    <div className="p-4 border-t border-border/40 bg-muted/10 mt-auto flex gap-3">
                      <Select 
                        value={post.status} 
                        onValueChange={(val: any) => handleUpdatePostStatus(post.id, val)}
                      >
                        <SelectTrigger className="w-full bg-background/80 h-10 rounded-lg font-medium focus-ring border-border/50">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/50 shadow-lg">
                          <SelectItem value="active" className="font-medium">Mark Active</SelectItem>
                          <SelectItem value="closed" className="font-medium">Mark Closed</SelectItem>
                          <SelectItem value="removed" className="font-medium text-destructive focus:text-destructive">Mark Removed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, highlight = false }: { label: string, value: number, highlight?: boolean }) {
  return (
    <Card className={`glass-card overflow-hidden rounded-2xl transition-all duration-300 ${highlight ? 'bg-primary/5 border-primary/30 shadow-md shadow-primary/10 scale-[1.02]' : 'border-border/50'}`}>
      <CardContent className="p-6">
        <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>{label}</p>
        <p className={`text-4xl font-serif font-bold ${highlight ? 'text-foreground' : 'text-foreground/90'}`}>{value}</p>
      </CardContent>
    </Card>
  );
}