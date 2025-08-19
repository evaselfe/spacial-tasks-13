import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AutoLoginProps {
  onLogin: (officer: any) => void;
}

export const AutoLogin = ({ onLogin }: AutoLoginProps) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if officer exists
      let { data: existingOfficer, error: fetchError } = await supabase
        .from("officers")
        .select("*")
        .eq("mobile_number", mobile.trim())
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (existingOfficer) {
        // Update existing officer's name if different
        if (existingOfficer.name !== name.trim()) {
          const { error: updateError } = await supabase
            .from("officers")
            .update({ name: name.trim() })
            .eq("id", existingOfficer.id);
          
          if (updateError) throw updateError;
          existingOfficer.name = name.trim();
        }
        onLogin(existingOfficer);
      } else {
        // Create new officer
        const { data: newOfficer, error: insertError } = await supabase
          .from("officers")
          .insert({
            name: name.trim(),
            mobile_number: mobile.trim(),
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
        onLogin(newOfficer);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Officer Auto Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter mobile number"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Join to Task"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};