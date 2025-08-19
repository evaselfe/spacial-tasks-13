import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { History, Clock, User, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface LoginHistory {
  id: string;
  name: string;
  mobile: string;
  login_time: string;
  role?: string;
}

export const HistoryTab = () => {
  const [mobileNumber, setMobileNumber] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAuthenticate = () => {
    if (mobileNumber === "8593919123") {
      setIsAuthenticated(true);
      fetchLoginHistory();
      toast({
        title: "Access Granted",
        description: "You can now view login history",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid mobile number",
        variant: "destructive",
      });
    }
  };

  const fetchLoginHistory = async () => {
    setLoading(true);
    try {
      // Fetch from officers table as it contains login information
      const { data, error } = await supabase
        .from("officers")
        .select("id, name, mobile_number, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const historyData = data?.map(officer => ({
        id: officer.id,
        name: officer.name,
        mobile: officer.mobile_number,
        login_time: officer.created_at,
        role: "Officer"
      })) || [];

      setLoginHistory(historyData);
    } catch (error: any) {
      console.error("Error fetching login history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch login history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setMobileNumber("");
    setLoginHistory([]);
  };

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Secure Access Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-6">
            <div className="mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground text-sm">
                Enter the authorized mobile number to access login history
              </p>
            </div>
            
            <div className="max-w-sm mx-auto space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Enter mobile number"
                  className="text-center"
                />
              </div>
              <Button 
                onClick={handleAuthenticate}
                className="w-full"
                disabled={!mobileNumber.trim()}
              >
                Authenticate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Login History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading login history...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="h-4 w-4" />
              <span>Total logins: {loginHistory.length}</span>
            </div>

            <div className="grid gap-3">
              {loginHistory.map((entry) => (
                <Card key={entry.id} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{entry.name}</p>
                          <p className="text-sm text-muted-foreground">{entry.mobile}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {entry.role}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.login_time), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {loginHistory.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No login history found</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};