import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CoordinatorFormProps {
  panchayath: any;
}

export const CoordinatorForm = ({ panchayath }: CoordinatorFormProps) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [ward, setWard] = useState("");
  const [rating, setRating] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !ward || !rating.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const wardNum = parseInt(ward);
    const ratingNum = parseFloat(rating);
    
    if (isNaN(wardNum) || wardNum < 1 || wardNum > panchayath.number_of_wards) {
      toast({
        title: "Error",
        description: `Ward must be between 1 and ${panchayath.number_of_wards}`,
        variant: "destructive",
      });
      return;
    }

    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
      toast({
        title: "Error",
        description: "Rating must be between 0 and 10",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("coordinators")
        .insert({
          panchayath_id: panchayath.id,
          name: name.trim(),
          mobile_number: mobile.trim(),
          ward: wardNum,
          rating: ratingNum,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Coordinator added successfully",
      });
      
      setName("");
      setMobile("");
      setWard("");
      setRating("");
    } catch (error: any) {
      console.error("Error adding coordinator:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add coordinator",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const wardOptions = Array.from({ length: panchayath.number_of_wards }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Coordinator</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coord-name">Name</Label>
              <Input
                id="coord-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coord-mobile">Mobile Number</Label>
              <Input
                id="coord-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter mobile number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coord-ward">Ward</Label>
              <Select value={ward} onValueChange={setWard}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ward" />
                </SelectTrigger>
                <SelectContent>
                  {wardOptions.map((wardNum) => (
                    <SelectItem key={wardNum} value={wardNum.toString()}>
                      Ward {wardNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coord-rating">Rating (0-10)</Label>
              <Input
                id="coord-rating"
                type="number"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="Enter rating"
                min="0"
                max="10"
                step="0.1"
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Coordinator"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};