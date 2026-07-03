import { Layout } from "@/components/layout";
import { useGetPost, useCreateConnectionRequest } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Eye, MessageCircle, ShieldCheck, Loader2, ArrowLeft, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { addToken, getTokensHeader } from "@/lib/token";
import { useState } from "react";

const requestSchema = z.object({
  message: z.string().min(5, "Message must be at least 5 characters").max(1000, "Message is too long"),
  contactNote: z.string().max(300, "Contact note is too long").optional(),
});

export function PostDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const postId = parseInt(id, 10);
  const { data: post, isLoading } = useGetPost(postId);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      message: "",
      contactNote: "",
    },
  });

  const handleManualSubmit = async (values: z.infer<typeof requestSchema>) => {
    // Maintenance Mode Check
    if (localStorage.getItem("gc-maintenance-mode") === "true") {
      toast({
        variant: "destructive",
        title: "Platform in Maintenance",
        description: "The system is currently in read-only mode for maintenance. Please try again later.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getTokensHeader()
        },
        body: JSON.stringify({
          message: values.message,
          contactNote: values.contactNote || undefined,
        })
      });

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      addToken(data.requesterToken);
      setSubmitted(true);
      toast({
        title: "Request sent securely",
        description: "An admin will review and mediate your connection.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to send request",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 flex justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center animate-fade-in-up">
          <h1 className="text-4xl font-serif font-bold mb-4 tracking-tight">Post not found</h1>
          <p className="text-muted-foreground mb-8 text-lg">The post you are looking for does not exist or was removed.</p>
          <Button size="lg" className="rounded-full px-8" onClick={() => setLocation("/browse")}>Back to browse</Button>
        </div>
      </Layout>
    );
  }

  const URGENCY_CONFIG: Record<string, { label: string, className: string }> = {
    casual: { label: "Casual", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none" },
    urgent: { label: "Urgent", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-none animate-pulse" },
    looking_for_long_term: { label: "Long Term", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none" },
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 md:py-16 max-w-5xl flex flex-col lg:flex-row gap-10 animate-fade-in-up">
        <div className="flex-1 space-y-8">
          <Button variant="ghost" className="mb-2 -ml-4 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50" onClick={() => setLocation("/browse")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to posts
          </Button>
          
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none px-3 py-1.5 rounded-full font-semibold text-sm">
                {post.category}
              </Badge>
              {post.urgency && URGENCY_CONFIG[post.urgency] && (
                <Badge variant="outline" className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${URGENCY_CONFIG[post.urgency].className}`}>
                  {URGENCY_CONFIG[post.urgency].label}
                </Badge>
              )}
              <span className="text-sm font-medium text-muted-foreground flex items-center">
                Posted {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
              {post.expiresAt && (
                <span className="text-sm font-medium text-red-500 flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-lg">
                  Expires {formatDistanceToNow(new Date(post.expiresAt), { addSuffix: true })}
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 tracking-tight leading-tight text-balance">{post.title}</h1>
            
            <div className="flex items-center gap-3 mb-10 p-4 bg-muted/30 rounded-2xl border border-border/40 inline-flex">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-lg border border-border/50 shadow-sm">
                {post.alias.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground leading-none mb-1">Posted by</p>
                <p className="font-semibold text-foreground leading-none">{post.alias}</p>
              </div>
            </div>
            
            {(() => {
              const images = (post as any).imageUrls && (post as any).imageUrls.length 
                ? (post as any).imageUrls 
                : (post.imageUrl ? [post.imageUrl] : []);
              if (images.length === 0) return null;
              return (
                <div className="mb-8 space-y-3">
                  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-none rounded-3xl border border-border/40 bg-muted/20 p-2 max-h-[450px]">
                    {images.map((url: string, idx: number) => (
                      <div key={idx} className="snap-center shrink-0 w-full flex items-center justify-center snap-always">
                        <img src={url} alt={`Post media ${idx + 1}`} className="w-full object-contain max-h-[430px] rounded-2xl" />
                      </div>
                    ))}
                  </div>
                  {images.length > 1 && (
                    <div className="flex justify-center gap-1.5 pt-1">
                      {images.map((_: any, idx: number) => (
                        <span key={idx} className="w-2.5 h-2.5 rounded-full bg-primary/25" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="prose prose-base md:prose-lg dark:prose-invert max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {post.description}
            </div>

            {post.skills && post.skills.length > 0 && (
              <div className="mt-10 pt-8 border-t border-border/40">
                <h3 className="text-sm font-bold mb-4 text-muted-foreground uppercase tracking-widest">Relevant Skills & Interests</h3>
                <div className="flex flex-wrap gap-2.5">
                  {post.skills.map((skill) => (
                    <span key={skill} className="px-4 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold shadow-sm border border-border/50">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-border/40 flex items-center gap-8 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
                <Eye className="w-4 h-4" />
                {post.viewCount} views
              </span>
              <span className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
                <MessageCircle className="w-4 h-4" />
                {post.requestCount} requests
              </span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[420px] shrink-0">
          <Card className="sticky top-24 glass-card border-primary/20 shadow-xl shadow-primary/5 rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/10 px-6 py-6">
              <CardTitle className="flex items-center gap-2.5 text-2xl font-serif">
                <div className="p-2 bg-white dark:bg-black rounded-full shadow-sm border border-primary/20">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                Request to Connect
              </CardTitle>
              <CardDescription className="text-base mt-2 text-balance leading-relaxed">
                Your identity is hidden. An admin will read your message and forward it safely.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {post.status !== "active" ? (
                <div className="text-center py-8 text-muted-foreground font-medium bg-muted/30 rounded-2xl border border-dashed border-border/50">
                  This post is no longer accepting requests.
                </div>
              ) : submitted ? (
                <div className="text-center py-8 animate-pop-in">
                  <div className="w-16 h-16 bg-white dark:bg-black text-primary rounded-full shadow-md flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif font-bold text-2xl mb-2">Request Sent</h3>
                  <p className="text-base text-muted-foreground mb-8 text-balance">
                    Check "My Activity" later to see if they replied.
                  </p>
                  <Button variant="outline" className="w-full rounded-full h-12 font-medium" onClick={() => setLocation("/my-activity")}>
                    View My Activity
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Your Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Hi, I'm interested! I have experience with..." 
                              className="min-h-[140px] resize-y bg-background/60 rounded-xl focus-ring text-base p-4" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactNote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold flex items-center justify-between">
                            Contact Note 
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-widest font-bold">Admin Only</Badge>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Optional: My instagram is @..." className="bg-background/60 h-12 rounded-xl focus-ring" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                            Only the admin sees this, in case they need to reach you outside the platform.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full h-14 rounded-full shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-base font-semibold mt-4" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                      Send Secure Request
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}