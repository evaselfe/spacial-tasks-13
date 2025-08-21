import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CoordinatorFormProps {
  selectedPanchayath?: any;
  editingCoordinator?: any;
  onEditComplete?: () => void;
}

export const CoordinatorForm = ({ selectedPanchayath: preSelectedPanchayath, editingCoordinator, onEditComplete }: CoordinatorFormProps) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [ward, setWard] = useState("");
  const [rating, setRating] = useState("");
  const [panchayathId, setPanchayathId] = useState("");
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const isEditing = !!editingCoordinator;
  const { toast } = useToast();

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  useEffect(() => {
    if (preSelectedPanchayath) {
      setPanchayathId(preSelectedPanchayath.id);
    }
  }, [preSelectedPanchayath]);

  useEffect(() => {
    if (editingCoordinator) {
      setName(editingCoordinator.name);
      setMobile(editingCoordinator.mobile_number);
      setWard(editingCoordinator.ward.toString());
      setRating(editingCoordinator.rating.toString());
      setPanchayathId(editingCoordinator.panchayath_id);
    }
  }, [editingCoordinator]);

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

    // Validate mobile number (exactly 10 digits)
    if (!/^\d{10}$/.test(mobile.trim())) {
      toast({
        title: "Error",
        description: "Mobile number must be exactly 10 digits",
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
      if (isEditing) {
        const { error } = await supabase
          .from("coordinators")
          .update({
            name: name.trim(),
            mobile_number: mobile.trim(),
            ward: wardNum,
            rating: ratingNum,
          })
          .eq("id", editingCoordinator.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Coordinator updated successfully",
        });
        
        onEditComplete?.();
      } else {
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
      }
    } catch (error: any) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} coordinator:`, error);
      let errorMessage = `Failed to ${isEditing ? 'update' : 'add'} coordinator`;
      if (error.code === '23505') {
        if (error.message.includes('mobile_number')) {
          errorMessage = "This mobile number is already registered";
        } else if (error.message.includes('panchayath_id, ward')) {
          errorMessage = "A coordinator is already assigned to this ward";
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
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
        <CardTitle>{isEditing ? 'Edit Coordinator' : 'Add Coordinator'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!preSelectedPanchayath && (
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
          )}
          
          {preSelectedPanchayath && (
            <div className="space-y-2">
              <Label>Selected Panchayath</Label>
              <div className="p-3 bg-muted rounded-md border">
                <span className="font-medium">{preSelectedPanchayath.name}</span>
                <span className="text-muted-foreground ml-2">({preSelectedPanchayath.number_of_wards} wards)</span>
              </div>
            </div>
          )}
          
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
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(value);
                }}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
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
            {loading ? (isEditing ? "Updating..." : "Adding...") : (isEditing ? "Update Coordinator" : "Add Coordinator")}
          </Button>
          {isEditing && (
            <Button type="button" variant="outline" onClick={onEditComplete}>
              Cancel
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};