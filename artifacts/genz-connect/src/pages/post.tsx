import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePost, useListCategories } from "@workspace/api-client-react";
import { addToken } from "@/lib/token";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Loader2, Info, Sparkles, Upload, X, Calendar, Flame, EyeOff, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  title: z.string().min(3, "Title must be at least 3 characters").max(120, "Title is too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description is too long"),
  skills: z.string().optional(),
  urgency: z.string().min(1, "Please select urgency level"),
  expiryDuration: z.string().min(1, "Please select expiry duration"),
  contactNote: z.string().max(300, "Contact handle is too long").optional(),
  agreement: z.boolean().refine((val) => val === true, "You must agree to continue"),
});

export function Post() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const createPost = useCreatePost();
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      title: "",
      description: "",
      skills: "",
      urgency: "casual",
      expiryDuration: "7d",
      contactNote: "",
      agreement: false,
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 3 - imageUrls.length;
      if (remainingSlots <= 0) {
        toast({
          variant: "destructive",
          title: "Limit reached",
          description: "You can upload up to 3 images per post.",
        });
        return;
      }
      
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      filesToProcess.forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "File too large",
            description: `Image "${file.name}" is larger than 2MB.`,
          });
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setImageUrls(prev => [...prev, base64String]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Maintenance Mode Check
    if (localStorage.getItem("gc-maintenance-mode") === "true") {
      toast({
        variant: "destructive",
        title: "Platform in Maintenance",
        description: "The system is currently in read-only mode for maintenance. Please try again later.",
      });
      return;
    }

    // Profanity Filter Check
    const bannedWordsStr = localStorage.getItem("gc-banned-words") || "spam,scam,money,hack";
    const bannedWords = bannedWordsStr.split(",").map(w => w.trim().toLowerCase()).filter(Boolean);
    const textToTest = `${values.title} ${values.description} ${values.skills || ""}`.toLowerCase();
    const foundBannedWord = bannedWords.find(word => textToTest.includes(word));
    if (foundBannedWord) {
      toast({
        variant: "destructive",
        title: "Moderation Filter Triggered",
        description: `Your post contains a restricted word ("${foundBannedWord}"). Please rewrite it professionally.`,
      });
      return;
    }

    const skillsArray = values.skills 
      ? values.skills.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    createPost.mutate({
      data: {
        category: values.category as any,
        title: values.title,
        description: values.description,
        skills: skillsArray,
        imageUrls: imageUrls,
        urgency: values.urgency as any,
        expiryDuration: values.expiryDuration as any,
        contactNote: values.contactNote || undefined,
      }
    }, {
      onSuccess: (data) => {
        addToken(data.ownerToken);
        setSuccessToken(data.ownerToken);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Failed to create post",
          description: "Please try again later.",
        });
      }
    });
  };

  if (successToken) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-xl animate-pop-in">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-xl shadow-primary/5 rounded-3xl overflow-hidden relative">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full"></div>
            <CardContent className="pt-10 pb-10 text-center space-y-6 relative z-10">
              <div className="w-20 h-20 bg-white dark:bg-black rounded-full shadow-md flex items-center justify-center mx-auto mb-2 border border-primary/20 animate-bounce" style={{ animationIterationCount: 3 }}>
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">Published Safely</h2>
              <p className="text-lg text-muted-foreground px-4 text-balance">
                Your post is live and completely anonymous. We've securely saved a token in your browser.
              </p>
              
              <Alert className="bg-white/60 dark:bg-black/40 backdrop-blur-sm border-primary/20 text-left mt-8 rounded-2xl">
                <Info className="w-5 h-5 text-primary" />
                <AlertTitle className="font-semibold text-base">How to check replies</AlertTitle>
                <AlertDescription className="text-muted-foreground mt-2 leading-relaxed">
                  Head over to <strong>My Activity</strong> to check if anyone has requested to connect with you. Since there are no accounts, make sure you don't clear your browser data.
                </AlertDescription>
              </Alert>

              <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform" onClick={() => setLocation("/my-activity")}>
                  Go to My Activity
                </Button>
                <Button size="lg" variant="outline" className="rounded-full bg-transparent hover:bg-muted/50" onClick={() => setLocation("/browse")}>
                  Browse Posts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-2xl animate-fade-in-up">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight">Create a Post</h1>
          <p className="text-lg text-muted-foreground text-balance">Share what you need, find your people. Everything is 100% anonymous.</p>
        </div>

        <Alert className="mb-10 bg-primary/5 border-primary/20 rounded-2xl shadow-sm">
          <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
          <AlertTitle className="text-primary font-semibold text-base">Safe & Anonymous</AlertTitle>
          <AlertDescription className="text-muted-foreground text-sm mt-1.5 leading-relaxed">
            There are no user accounts. Your identity is never shown. When someone wants to connect, an admin will securely mediate the conversation.
          </AlertDescription>
        </Alert>

        <div className="glass-card p-6 md:p-10 rounded-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50 h-12 rounded-xl focus-ring">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {categories?.map(cat => (
                          <SelectItem key={cat.slug} value={cat.slug}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Looking for a React developer for hackathon" className="bg-background/50 h-12 rounded-xl focus-ring text-base" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what you're looking for in detail..." 
                        className="min-h-[160px] bg-background/50 resize-y rounded-xl focus-ring text-base p-4 leading-relaxed" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Skills or Interests (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., React, Design, Coffee (comma separated)" className="bg-background/50 h-12 rounded-xl focus-ring text-base" {...field} />
                    </FormControl>
                    <p className="text-sm text-muted-foreground mt-2">
                      Help others find you by listing relevant keywords.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills" // Using an existing schema key so it matches types cleanly (or we can use any key)
                render={() => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      Attach Images (Optional, up to 3)
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {imageUrls.map((url, idx) => (
                          <div key={idx} className="relative rounded-2xl overflow-hidden border border-primary/20 bg-muted/20 h-32 flex items-center justify-center p-2 group shadow-sm">
                            <img src={url} alt={`Preview ${idx + 1}`} className="max-h-full object-contain rounded-xl w-full" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 w-6 h-6 rounded-full shadow-md"
                              onClick={() => removeImage(idx)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                        {imageUrls.length < 3 && (
                          <div className="border-2 border-dashed border-border/70 hover:border-primary/50 bg-background/25 hover:bg-background/40 transition-all rounded-2xl p-4 text-center cursor-pointer relative flex flex-col items-center justify-center gap-1.5 h-32">
                            <Upload className="w-6 h-6 text-muted-foreground" />
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-foreground/80">Upload image</p>
                              <p className="text-[10px] text-muted-foreground">Up to 2MB</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={handleImageChange}
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <Flame className="w-4 h-4 text-primary" />
                        Urgency Level
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 h-12 rounded-xl focus-ring">
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="casual">Casual (Friendly/Discussion)</SelectItem>
                          <SelectItem value="urgent">Urgent (ASAP/Deadline)</SelectItem>
                          <SelectItem value="looking_for_long_term">Looking for Long-Term</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Post Expiry
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background/50 h-12 rounded-xl focus-ring">
                            <SelectValue placeholder="Select expiry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="24h">24 Hours</SelectItem>
                          <SelectItem value="3d">3 Days</SelectItem>
                          <SelectItem value="7d">7 Days</SelectItem>
                          <SelectItem value="30d">30 Days</SelectItem>
                          <SelectItem value="never">Never (Keep Active)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contactNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <EyeOff className="w-4 h-4 text-primary" />
                        Your Contact Handle (Admin Only)
                      </span>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-widest font-bold bg-primary/10 text-primary border-none">Confidential</Badge>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Instagram: @name, Telegram: @handle, or Phone" className="bg-background/50 h-12 rounded-xl focus-ring text-base" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      This is strictly confidential. Only the admin will see this handle, and will use it to contact you when someone requests to connect.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agreement"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-2xl border border-primary/10 bg-primary/5 p-4 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-0.5"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-semibold text-foreground/90 cursor-pointer">
                        I understand my post will be anonymous and connection requests may be reviewed.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <div className="pt-6 flex justify-end">
                <Button type="submit" size="lg" disabled={createPost.isPending} className="w-full sm:w-auto h-14 px-10 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all text-base font-semibold">
                  {createPost.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                  Post Anonymously
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}