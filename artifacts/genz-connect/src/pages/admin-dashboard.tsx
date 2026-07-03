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
import { Loader2, LogOut, CheckCircle, XCircle, Send, MessageCircle, BarChart3, Database, Trash2, RefreshCw, EyeOff, Ban, Settings, Play, Download, Calendar, ShieldAlert, Sparkles, TrendingUp, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [profanityList, setProfanityList] = useState(() => localStorage.getItem("gc-banned-words") || "spam,scam,money,hack");
  const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem("gc-maintenance-mode") === "true");
  const [broadcastMessage, setBroadcastMessage] = useState(() => localStorage.getItem("gc-broadcast-msg") || "");
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("gc-audit-logs") || "[]"); } catch { return []; }
  });
  const [bannedTokens, setBannedTokens] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("gc-banned-tokens") || "[]"); } catch { return []; }
  });
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem("gc-pinned-posts") || "[]"); } catch { return []; }
  });

  const addAuditLog = (action: string) => {
    const log = { id: Date.now(), action, time: new Date().toLocaleTimeString() };
    setAuditLogs(prev => {
      const next = [log, ...prev].slice(0, 50);
      localStorage.setItem("gc-audit-logs", JSON.stringify(next));
      return next;
    });
  };

  const handleSaveProfanity = (val: string) => {
    localStorage.setItem("gc-banned-words", val);
    setProfanityList(val);
    addAuditLog(`Updated banned words list: "${val.slice(0, 20)}..."`);
    toast({ title: "Banned words filter updated" });
  };

  const handleToggleMaintenance = () => {
    const next = !maintenanceMode;
    localStorage.setItem("gc-maintenance-mode", String(next));
    setMaintenanceMode(next);
    addAuditLog(`Maintenance mode toggled ${next ? "ON" : "OFF"}`);
    toast({ title: `Maintenance mode ${next ? "enabled" : "disabled"}` });
  };

  const handleSaveBroadcast = (val: string) => {
    localStorage.setItem("gc-broadcast-msg", val);
    setBroadcastMessage(val);
    addAuditLog(`Broadcast message set to: "${val}"`);
    toast({ title: "Global campus broadcast updated" });
  };

  const handleTogglePin = (id: number) => {
    setPinnedPosts(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      localStorage.setItem("gc-pinned-posts", JSON.stringify(next));
      addAuditLog(`Toggled Pin priority on Post #${id}`);
      return next;
    });
  };

  const handleBanToken = (token: string) => {
    if (!token.trim()) return;
    setBannedTokens(prev => {
      if (prev.includes(token)) return prev;
      const next = [...prev, token];
      localStorage.setItem("gc-banned-tokens", JSON.stringify(next));
      addAuditLog(`Banned user token: "${token}"`);
      return next;
    });
    toast({ title: "User token blacklisted" });
  };

  const handleUnbanToken = (token: string) => {
    setBannedTokens(prev => {
      const next = prev.filter(t => t !== token);
      localStorage.setItem("gc-banned-tokens", JSON.stringify(next));
      addAuditLog(`Lifted ban on user token: "${token}"`);
      return next;
    });
    toast({ title: "User token unbanned" });
  };

  const handlePermanentDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this post? This will delete all connected requests and messages!")) return;
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Post permanently deleted" });
      addAuditLog(`Permanently deleted Post #${id} and connection data`);
      queryClient.invalidateQueries({ queryKey: getListAdminPostsQueryKey() });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete post" });
    }
  };

  const handleExtendExpiry = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/posts/${id}/extend`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Expiry extended by 7 days" });
      addAuditLog(`Extended Expiry for Post #${id} by 7 days`);
      queryClient.invalidateQueries({ queryKey: getListAdminPostsQueryKey() });
    } catch {
      toast({ variant: "destructive", title: "Failed to extend expiry" });
    }
  };

  const handleAdjustViews = async (id: number, delta: number) => {
    try {
      const res = await fetch(`/api/admin/posts/${id}/views`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta })
      });
      if (!res.ok) throw new Error("Failed");
      addAuditLog(`Adjusted views on Post #${id} by ${delta}`);
      queryClient.invalidateQueries({ queryKey: getListAdminPostsQueryKey() });
    } catch {
      toast({ variant: "destructive", title: "Failed to adjust views" });
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ posts, requests }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `genz_connect_export_${Date.now()}.json`);
    dlAnchorElem.click();
    addAuditLog("Exported system database to JSON");
    toast({ title: "Data exported successfully" });
  };

  const handleSeedMockData = async () => {
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      if (!res.ok) {
        // Fallback to standard admin seed path if not route mapped on base
        const res2 = await fetch("/api/admin/seed", { method: "POST" });
        if (!res2.ok) throw new Error("Failed");
      }
      toast({ title: `Successfully seeded active student posts` });
      addAuditLog("Seeded realistic student posts");
      queryClient.invalidateQueries({ queryKey: getListAdminPostsQueryKey() });
    } catch {
      toast({ variant: "destructive", title: "Failed to seed database" });
    }
  };

  const handleResetSystem = async () => {
    if (!confirm("CRITICAL WARNING: This will completely wipe all posts, connection requests, and messages from the database! Proceed?")) return;
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "System database fully wiped" });
      addAuditLog("Wiped system database tables");
      queryClient.invalidateQueries({ queryKey: getListAdminPostsQueryKey() });
    } catch {
      toast({ variant: "destructive", title: "Failed to reset system" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPosts.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete all ${selectedPosts.length} selected posts?`)) return;
    try {
      await Promise.all(
        selectedPosts.map(id => fetch(`/api/admin/posts/${id}`, { method: "DELETE" }))
      );
      toast({ title: `Successfully deleted ${selectedPosts.length} posts` });
      addAuditLog(`Bulk deleted ${selectedPosts.length} posts`);
      setSelectedPosts([]);
      queryClient.invalidateQueries({ queryKey: getListAdminPostsQueryKey() });
    } catch {
      toast({ variant: "destructive", title: "Bulk delete operation failed" });
    }
  };
  
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

  const [approvingAll, setApprovingAll] = useState(false);

  const handleApproveAllPending = async () => {
    const pendingReqs = requests?.filter(r => r.status === "pending") || [];
    if (pendingReqs.length === 0) {
      toast({ title: "No pending requests to approve" });
      return;
    }

    setApprovingAll(true);
    try {
      await Promise.all(
        pendingReqs.map(req => 
          new Promise<void>((resolve, reject) => {
            approveReq.mutate({ id: req.id }, {
              onSuccess: () => resolve(),
              onError: (err) => reject(err)
            });
          })
        )
      );
      toast({ title: `Successfully approved all ${pendingReqs.length} pending requests` });
      queryClient.invalidateQueries({ queryKey: getListAdminRequestsQueryKey() });
    } catch (error) {
      console.error(error);
      toast({ 
        variant: "destructive",
        title: "Failed to approve some requests", 
        description: "Please try again." 
      });
    } finally {
      setApprovingAll(false);
    }
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
            <TabsTrigger value="control" className="px-8 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:font-bold text-base transition-all">
              Control Center
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

              {reqStatusFilter === "pending" && requests && requests.filter(r => r.status === "pending").length > 0 && (
                <Button 
                  onClick={handleApproveAllPending} 
                  disabled={approvingAll}
                  className="rounded-full shadow-lg shadow-emerald-500/10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 border-none"
                >
                  {approvingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve All Pending
                    </>
                  )}
                </Button>
              )}
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
            <div className="flex flex-wrap items-center justify-between gap-4">
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

              {selectedPosts.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete} className="rounded-full shadow-lg shadow-red-500/10 font-bold h-11 px-6">
                  <Trash2 className="w-4 h-4 mr-2" /> Bulk Delete Permanently ({selectedPosts.length})
                </Button>
              )}
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
                    {(() => {
                      const images = (post as any).imageUrls && (post as any).imageUrls.length 
                        ? (post as any).imageUrls 
                        : (post.imageUrl ? [post.imageUrl] : []);
                      if (images.length === 0) return null;
                      return (
                        <div className="h-40 w-full grid grid-cols-3 gap-0.5 border-b border-border/40 overflow-hidden relative">
                          {images.map((url: string, idx: number) => (
                            <img key={idx} src={url} alt={`Post media ${idx + 1}`} className="w-full h-full object-cover" />
                          ))}
                        </div>
                      );
                    })()}
                    <CardHeader className="pb-4 bg-muted/5 border-b border-border/30">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={selectedPosts.includes(post.id)}
                            onChange={() => {
                              setSelectedPosts(prev => 
                                prev.includes(post.id) ? prev.filter(id => id !== post.id) : [...prev, post.id]
                              );
                            }}
                            className="w-4 h-4 rounded border-border text-primary cursor-pointer accent-primary"
                          />
                          <Badge variant="outline" className="font-semibold bg-background">{post.category}</Badge>
                          {pinnedPosts.includes(post.id) && (
                            <Badge variant="default" className="bg-amber-500 text-white border-none text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              📌 Pinned
                            </Badge>
                          )}
                        </div>
                        <Badge variant={post.status === "active" ? "default" : post.status === "removed" ? "destructive" : "secondary"} className="shadow-sm">
                          {post.status.toUpperCase()}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl font-serif leading-snug flex items-center justify-between gap-2">
                        <span>{post.title}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleTogglePin(post.id)}
                          className={`w-8 h-8 rounded-full p-0 flex items-center justify-center hover:bg-muted/50 ${pinnedPosts.includes(post.id) ? 'bg-amber-500/10' : ''}`}
                        >
                          📌
                        </Button>
                      </CardTitle>
                      <CardDescription className="font-medium mt-2 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground border border-border/50">{post.alias.charAt(0).toUpperCase()}</span>
                        {post.alias}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 py-5 space-y-4">
                      <p className="text-sm text-muted-foreground/90 line-clamp-3 leading-relaxed">{post.description}</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2">
                        {post.urgency && (
                          <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            post.urgency === "urgent" ? "bg-red-500/10 text-red-600 border-none" :
                            post.urgency === "looking_for_long_term" ? "bg-amber-500/10 text-amber-600 border-none" :
                            "bg-blue-500/10 text-blue-600 border-none"
                          }`}>
                            Urgency: {post.urgency.replace(/_/g, " ")}
                          </Badge>
                        )}
                        {post.expiresAt && (
                          <Badge variant="secondary" className="bg-red-500/5 text-red-500 dark:text-red-400 border-none text-[10px] font-semibold">
                            Expires: {new Date(post.expiresAt).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>

                      <div className="pt-3 border-t border-border/40 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-muted-foreground flex items-center gap-1"><Users className="w-3.5 h-3.5"/> Views Adjustment:</span>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="outline" className="w-6 h-6 rounded-md hover:bg-muted" onClick={() => handleAdjustViews(post.id, -10)}>-</Button>
                            <span className="font-bold font-mono text-sm w-8 text-center">{post.viewCount}</span>
                            <Button size="icon" variant="outline" className="w-6 h-6 rounded-md hover:bg-muted" onClick={() => handleAdjustViews(post.id, 10)}>+</Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Expiration:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground/80">{post.expiresAt ? new Date(post.expiresAt).toLocaleDateString() : "Never"}</span>
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] rounded-md font-bold hover:bg-muted" onClick={() => handleExtendExpiry(post.id)}>
                              +7 Days
                            </Button>
                          </div>
                        </div>
                      </div>

                      {post.contactNote && (
                        <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs">
                          <span className="font-bold text-primary flex items-center gap-1.5 mb-1">
                            🔑 Poster Contact Handle (Private):
                          </span>
                          <code className="bg-white/60 dark:bg-black/40 px-2 py-1 rounded text-foreground font-mono block break-all mt-1">
                            {post.contactNote}
                          </code>
                        </div>
                      )}
                    </CardContent>
                    <div className="p-4 border-t border-border/40 bg-muted/10 mt-auto flex gap-3 items-center justify-between">
                      <div className="flex gap-2 flex-1">
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

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="h-10 font-semibold px-4 rounded-lg">
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-3xl border-border/50 p-8 sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="mb-6">
                              <DialogTitle className="text-2xl font-serif">Edit Post #{post.id}</DialogTitle>
                              <DialogDescription className="text-base mt-2">
                                Make corrections to this user's anonymous post description, title, tags, or contact handles.
                              </DialogDescription>
                            </DialogHeader>
                            
                            <EditPostForm post={post} onSave={() => queryClient.invalidateQueries({ queryKey: getListAdminPostsQueryKey() })} />
                          </DialogContent>
                        </Dialog>
                      </div>

                      <Button variant="ghost" size="icon" onClick={() => handlePermanentDelete(post.id)} className="w-10 h-10 rounded-lg text-destructive hover:bg-destructive/15">
                        <Trash2 className="w-[18px] h-[18px]" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="control" className="space-y-8 animate-fade-in-up">
            
            {/* Grid 1: Analytics & Health Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card border-border/55 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary"/> Category Share</h3>
                  <Badge variant="outline">Distribution</Badge>
                </div>
                {posts && posts.length > 0 ? (
                  <div className="space-y-3">
                    {["project_collab", "hackathon_team", "find_friends", "study_group", "college_help"].map(cat => {
                      const count = posts.filter(p => p.category === cat).length;
                      const percentage = Math.round((count / posts.length) * 100) || 0;
                      return (
                        <div key={cat} className="space-y-1 text-xs font-semibold">
                          <div className="flex justify-between text-muted-foreground">
                            <span className="capitalize">{cat.replace(/_/g, " ")}</span>
                            <span>{count} posts ({percentage}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/80 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">No posts data available.</p>
                )}
              </Card>

              <Card className="glass-card border-border/55 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-serif font-bold text-lg flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500"/> Connect Conversion</h3>
                  <p className="text-xs text-muted-foreground mt-1">Percentage of connection requests successfully approved by moderators.</p>
                </div>
                {requests && requests.length > 0 ? (
                  (() => {
                    const approved = requests.filter(r => r.status === "approved").length;
                    const pct = Math.round((approved / requests.length) * 100);
                    return (
                      <div className="space-y-2 text-center py-2">
                        <div className="text-4xl font-black text-emerald-500 font-mono">{pct}%</div>
                        <p className="text-xs font-bold text-muted-foreground">{approved} of {requests.length} requests approved</p>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center text-sm font-medium text-muted-foreground py-6">No request statistics.</div>
                )}
              </Card>

              <Card className="glass-card border-border/55 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-serif font-bold text-lg flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-500"/> System Health</h3>
                  <p className="text-xs text-muted-foreground mt-1">Platform operational status and security checklist metrics.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>Maintenance Mode:</span>
                    <span className={maintenanceMode ? "text-rose-500 font-bold" : "text-emerald-500 font-bold"}>{maintenanceMode ? "ON" : "OFF"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>Active Banned Tokens:</span>
                    <span className="font-mono text-sm">{bannedTokens.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>Active Pinned Posts:</span>
                    <span className="font-mono text-sm">{pinnedPosts.length}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Grid 2: Platform Configurations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Maintenance & Broadcast Settings */}
              <Card className="glass-card border-border/55 rounded-2xl p-6 space-y-6">
                <h3 className="font-serif font-bold text-xl flex items-center gap-2"><Settings className="w-5 h-5 text-foreground/70"/> Live Operations Config</h3>
                
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">System Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground">Blocks all post publications and request forms.</p>
                  </div>
                  <Button variant={maintenanceMode ? "destructive" : "secondary"} className="rounded-full h-9 font-semibold" onClick={handleToggleMaintenance}>
                    {maintenanceMode ? "Disable Mode" : "Enable Mode"}
                  </Button>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-primary"/> Campus Announcement Banner</label>
                  <div className="flex gap-2">
                    <Input 
                      value={broadcastMessage} 
                      onChange={e => setBroadcastMessage(e.target.value)} 
                      placeholder="e.g. Free Pizza at library building today at 4!" 
                      className="rounded-xl focus-ring bg-muted/20 text-sm"
                    />
                    <Button className="rounded-xl px-5 h-11 font-semibold" onClick={() => handleSaveBroadcast(broadcastMessage)}>Save</Button>
                  </div>
                  {broadcastMessage && (
                    <Button variant="ghost" size="sm" className="text-[10px] text-rose-500 p-0 font-bold" onClick={() => handleSaveBroadcast("")}>Clear Announcement</Button>
                  )}
                </div>
              </Card>

              {/* Profanity Filter Blacklist */}
              <Card className="glass-card border-border/55 rounded-2xl p-6 space-y-4">
                <h3 className="font-serif font-bold text-xl flex items-center gap-2"><Ban className="w-5 h-5 text-foreground/70"/> Automated Spam Blacklist</h3>
                <p className="text-xs text-muted-foreground">Add words (comma separated) that will automatically block a student from publishing a post or request if matched.</p>
                <div className="space-y-3">
                  <Textarea 
                    value={profanityList} 
                    onChange={e => setProfanityList(e.target.value)}
                    rows={4}
                    className="rounded-xl focus-ring bg-muted/20 font-mono text-sm resize-none" 
                  />
                  <Button className="w-full rounded-xl font-bold h-11" onClick={() => handleSaveProfanity(profanityList)}>
                    Update Filter Rules
                  </Button>
                </div>
              </Card>
            </div>

            {/* Grid 3: Database & Maintenance Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Maintenance Tools */}
              <Card className="glass-card border-border/55 rounded-2xl p-6 space-y-5">
                <h3 className="font-serif font-bold text-xl flex items-center gap-2"><Database className="w-5 h-5 text-foreground/70"/> System DB Utilities</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="rounded-xl h-14 flex flex-col items-center justify-center p-2 font-bold" onClick={handleExportJSON}>
                    <Download className="w-5 h-5 mb-1 text-primary"/>
                    Export JSON
                  </Button>
                  <Button variant="outline" className="rounded-xl h-14 flex flex-col items-center justify-center p-2 font-bold" onClick={handleSeedMockData}>
                    <Play className="w-5 h-5 mb-1 text-emerald-500"/>
                    Seed Mock Posts
                  </Button>
                </div>

                <Button variant="destructive" className="w-full rounded-xl h-11 font-bold shadow-lg shadow-red-500/10" onClick={handleResetSystem}>
                  Wipe Database Tables
                </Button>
              </Card>

              {/* Blacklisted tokens (Security) */}
              <Card className="glass-card border-border/55 rounded-2xl p-6 space-y-4">
                <h3 className="font-serif font-bold text-xl flex items-center gap-2"><EyeOff className="w-5 h-5 text-foreground/70"/> Token Ban Control</h3>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input id="ban-token-input" placeholder="Enter owner token to ban..." className="rounded-xl focus-ring bg-muted/20 text-sm" />
                    <Button variant="destructive" className="rounded-xl px-5 h-11 font-semibold" onClick={() => {
                      const input = document.getElementById("ban-token-input") as HTMLInputElement;
                      if (input && input.value) {
                        handleBanToken(input.value);
                        input.value = "";
                      }
                    }}>Ban</Button>
                  </div>

                  <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {bannedTokens.length > 0 ? (
                      bannedTokens.map(tok => (
                        <div key={tok} className="flex justify-between items-center bg-background/50 border border-border/50 p-2.5 rounded-lg text-xs font-semibold">
                          <code className="font-mono text-muted-foreground">{tok.slice(0, 15)}...</code>
                          <Button size="sm" variant="ghost" className="text-emerald-500 hover:text-emerald-600 h-6 px-2" onClick={() => handleUnbanToken(tok)}>Lift Ban</Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground font-medium text-center py-4 bg-background/20 rounded-lg border border-dashed border-border/50">No blacklisted tokens.</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Section 4: Moderator Audit Logs */}
            <Card className="glass-card border-border/55 rounded-2xl p-6 space-y-4">
              <h3 className="font-serif font-bold text-xl flex items-center gap-2"><RefreshCw className="w-5 h-5 text-foreground/70"/> Moderator Audit Log</h3>
              <div className="border border-border/50 rounded-xl bg-background/40 divide-y divide-border/40 max-h-[250px] overflow-y-auto custom-scrollbar">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log: any) => (
                    <div key={log.id} className="p-3 text-xs font-semibold flex justify-between items-center hover:bg-muted/10 transition-colors">
                      <span className="text-foreground/90">{log.action}</span>
                      <span className="text-muted-foreground font-mono text-[10px]">{log.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-muted-foreground text-center py-12">No moderator logs yet. Actions taken will record here.</p>
                )}
              </div>
            </Card>

          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function EditPostForm({ post, onSave }: { post: any; onSave: () => void }) {
  const { toast } = useToast();
  const updatePost = useUpdateAdminPost();
  
  const [title, setTitle] = useState(post.title);
  const [description, setDescription] = useState(post.description);
  const [category, setCategory] = useState(post.category);
  const [urgency, setUrgency] = useState(post.urgency || "casual");
  const [contactNote, setContactNote] = useState(post.contactNote || "");
  const [skillsText, setSkillsText] = useState((post.skills || []).join(", "));
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const skills = skillsText
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    updatePost.mutate({
      id: post.id,
      data: {
        status: post.status,
        title,
        description,
        category,
        urgency,
        contactNote: contactNote || undefined,
        skills,
      } as any
    }, {
      onSuccess: () => {
        toast({ title: "Post updated successfully" });
        setIsSaving(false);
        onSave();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to update post" });
        setIsSaving(false);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold">Title</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} className="rounded-xl focus-ring bg-muted/20" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Description</label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl focus-ring bg-muted/20 resize-none font-sans" rows={4} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl focus-ring bg-muted/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="project_collab">Project Collab</SelectItem>
              <SelectItem value="hackathon_team">Hackathon Team</SelectItem>
              <SelectItem value="find_friends">Find Friends</SelectItem>
              <SelectItem value="study_group">Study Group</SelectItem>
              <SelectItem value="college_help">College Help</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Urgency</label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger className="rounded-xl focus-ring bg-muted/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="looking_for_long_term">Long Term</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Skills / Tags (comma separated)</label>
        <Input value={skillsText} onChange={e => setSkillsText(e.target.value)} className="rounded-xl focus-ring bg-muted/20" placeholder="e.g. React, UI/UX, Python" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">Contact Handle (Confidential)</label>
        <Input value={contactNote} onChange={e => setContactNote(e.target.value)} className="rounded-xl focus-ring bg-muted/20" placeholder="e.g. Instagram, Phone, Email" />
      </div>

      <Button type="submit" className="w-full rounded-full h-12 font-bold shadow-lg" disabled={isSaving}>
        {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : "Save Changes"}
      </Button>
    </form>
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