import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const CoordinatorForm = () => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [ward, setWard] = useState("");
  const [rating, setRating] = useState("");
  const [panchayathId, setPanchayathId] = useState("");
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  useEffect(() => {
    if (panchayathId) {
      const panchayath = panchayaths.find(p => p.id === panchayathId);
      setSelectedPanchayath(panchayath);
      setWard(""); // Reset ward when panchayath changes
    } else {
      setSelectedPanchayath(null);
    }
  }, [panchayathId, panchayaths]);

  const fetchPanchayaths = async () => {
    try {
      const { data, error } = await supabase
        .from("panchayaths")
        .select("*")
        .order("name");

      if (error) throw error;
      setPanchayaths(data || []);
    } catch (error) {
      console.error("Error fetching panchayaths:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !ward || !rating.trim() || !panchayathId) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select a panchayath",
        variant: "destructive",
      });
      return;
    }

    const wardNum = parseInt(ward);
    const ratingNum = parseFloat(rating);
    
    if (isNaN(wardNum) || wardNum < 1 || wardNum > selectedPanchayath.number_of_wards) {
      toast({
        title: "Error",
        description: `Ward must be between 1 and ${selectedPanchayath.number_of_wards}`,
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
          panchayath_id: panchayathId,
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
      setPanchayathId("");
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

  const wardOptions = selectedPanchayath ? Array.from({ length: selectedPanchayath.number_of_wards }, (_, i) => i + 1) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Coordinator</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Panchayath</Label>
            <Select value={panchayathId} onValueChange={setPanchayathId}>
              <SelectTrigger>
                <SelectValue placeholder="Select panchayath" />
              </SelectTrigger>
              <SelectContent>
                {panchayaths.map((panchayath) => (
                  <SelectItem key={panchayath.id} value={panchayath.id}>
                    {panchayath.name} ({panchayath.number_of_wards} wards)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
              <Select value={ward} onValueChange={setWard} disabled={!selectedPanchayath}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedPanchayath ? "Select ward" : "Select panchayath first"} />
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