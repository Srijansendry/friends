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
import { ShieldCheck, Loader2, Info, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  title: z.string().min(3, "Title must be at least 3 characters").max(120, "Title is too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description is too long"),
  skills: z.string().optional(),
});

export function Post() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useListCategories();
  const createPost = useCreatePost();
  const [successToken, setSuccessToken] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      title: "",
      description: "",
      skills: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const skillsArray = values.skills 
      ? values.skills.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    createPost.mutate({
      data: {
        category: values.category as any,
        title: values.title,
        description: values.description,
        skills: skillsArray,
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