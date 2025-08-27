import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { findUserByMobile, User, getRoleDisplayName } from "@/lib/authService";
import { Loader2, Search, Phone } from "lucide-react";

interface MobileLoginProps {
  onLogin: (user: User) => void;
}

export const MobileLogin = ({ onLogin }: MobileLoginProps) => {
  const [mobile, setMobile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFindMe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobile.trim()) {
      toast({
        title: "Mobile number required",
        description: "Please enter your mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await findUserByMobile(mobile);
      
      if (result.success && result.user) {
        toast({
          title: "Welcome!",
          description: `Logged in as ${result.user.name} (${getRoleDisplayName(result.user.role)})`,
        });
        onLogin(result.user);
      } else {
        toast({
          title: "Not registered",
          description: result.error || "You are not registered. Please contact administrator.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/95 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Phone className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Panchayath Management System</CardTitle>
          <CardDescription>
            Enter your mobile number to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFindMe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="text-center text-lg"
                maxLength={15}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Me
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              This system is for registered coordinators, supervisors, group leaders, PROs, and team members only.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};