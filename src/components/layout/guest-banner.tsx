"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession, signIn } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function GuestBanner() {
  const { data: session } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Only show banner for guest users
  if (!session?.user?.isGuest) {
    return null;
  }

  const handleConvertAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, create a permanent account
      const response = await fetch("/api/auth/convert-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          guestId: session.user.id,
          email, 
          password 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to convert account");
      }

      // Sign in with the new credentials
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      
      toast({
        title: "Success",
        description: "Your guest account has been converted to a permanent account.",
      });
      
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to convert account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-amber-100 dark:bg-amber-900 py-2 px-4 text-center">
      <div className="container flex items-center justify-center gap-4 flex-wrap">
        <p className="text-sm text-amber-800 dark:text-amber-100">
          You're currently using a guest account. Your data will be preserved for 30 days.
        </p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 bg-white text-amber-800 border-amber-400 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-500 font-medium shadow-sm transition-all"
            >
              Save your account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Convert to permanent account</DialogTitle>
              <DialogDescription>
                Create a permanent account to save your plans and access them from any device.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConvertAccount} className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters
                </p>
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Converting..." : "Convert account"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}