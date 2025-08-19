import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PanchayathFormProps {
  officerId: string;
  onPanchayathCreated: (panchayath: any) => void;
}

export const PanchayathForm = ({ officerId, onPanchayathCreated }: PanchayathFormProps) => {
  const [name, setName] = useState("");
  const [wards, setWards] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !wards.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const wardCount = parseInt(wards);
    if (isNaN(wardCount) || wardCount <= 0) {
      toast({
        title: "Error",
        description: "Number of wards must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("panchayaths")
        .insert({
          name: name.trim(),
          number_of_wards: wardCount,
          created_by: officerId,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Panchayath created successfully",
      });
      
      onPanchayathCreated(data);
      setName("");
      setWards("");
    } catch (error: any) {
      console.error("Error creating panchayath:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create panchayath",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Panchayath</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="panchayath-name">Panchayath Name</Label>
            <Input
              id="panchayath-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter panchayath name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ward-count">Number of Wards</Label>
            <Input
              id="ward-count"
              type="number"
              value={wards}
              onChange={(e) => setWards(e.target.value)}
              placeholder="Enter number of wards"
              min="1"
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Panchayath"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};