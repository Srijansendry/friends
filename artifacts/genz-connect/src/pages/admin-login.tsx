import { Layout } from "@/components/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminLogin } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useAdminLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({
      data: { password: values.password }
    }, {
      onSuccess: (data) => {
        if (data.authenticated) {
          toast({
            title: "Logged in successfully",
          });
          setLocation("/admin");
        } else {
          toast({
            variant: "destructive",
            title: "Invalid password",
          });
        }
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid password or server error",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-32 max-w-md flex flex-col items-center animate-fade-in-up">
        <div className="w-20 h-20 bg-background border border-border/50 text-foreground rounded-full flex items-center justify-center mb-8 shadow-sm">
          <ShieldAlert className="w-10 h-10" />
        </div>
        
        <Card className="w-full glass-card border-border/50 rounded-3xl overflow-hidden shadow-xl">
          <CardHeader className="text-center pt-8 pb-6 bg-muted/20 border-b border-border/30">
            <CardTitle className="text-3xl font-serif">Admin Access</CardTitle>
            <CardDescription className="text-base mt-2">
              Enter the admin password to manage requests and posts securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="bg-background/60 h-14 rounded-xl focus-ring text-lg tracking-widest text-center" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" size="lg" className="w-full h-14 rounded-xl text-base font-semibold shadow-lg mt-2" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}