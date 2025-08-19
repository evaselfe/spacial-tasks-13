import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SupervisorFormProps {
  panchayath: any;
}

export const SupervisorForm = ({ panchayath }: SupervisorFormProps) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [selectedWards, setSelectedWards] = useState<number[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCoordinators();
  }, [panchayath.id]);

  const fetchCoordinators = async () => {
    try {
      const { data, error } = await supabase
        .from("coordinators")
        .select("*")
        .eq("panchayath_id", panchayath.id);

      if (error) throw error;
      setCoordinators(data || []);
    } catch (error) {
      console.error("Error fetching coordinators:", error);
    }
  };

  const handleWardChange = (wardNum: number, checked: boolean) => {
    if (checked) {
      setSelectedWards([...selectedWards, wardNum]);
    } else {
      setSelectedWards(selectedWards.filter(w => w !== wardNum));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !coordinatorId || selectedWards.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select at least one ward",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Insert supervisor
      const { data: supervisor, error: supervisorError } = await supabase
        .from("supervisors")
        .insert({
          panchayath_id: panchayath.id,
          coordinator_id: coordinatorId,
          name: name.trim(),
          mobile_number: mobile.trim(),
        })
        .select()
        .single();

      if (supervisorError) throw supervisorError;

      // Insert ward mappings
      const wardMappings = selectedWards.map(ward => ({
        supervisor_id: supervisor.id,
        ward: ward,
      }));

      const { error: wardError } = await supabase
        .from("supervisor_wards")
        .insert(wardMappings);

      if (wardError) throw wardError;

      toast({
        title: "Success",
        description: "Supervisor added successfully",
      });
      
      setName("");
      setMobile("");
      setCoordinatorId("");
      setSelectedWards([]);
    } catch (error: any) {
      console.error("Error adding supervisor:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add supervisor",
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
        <CardTitle>Add Supervisor</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sup-name">Name</Label>
              <Input
                id="sup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sup-mobile">Mobile Number</Label>
              <Input
                id="sup-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter mobile number"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Select Coordinator</Label>
            <Select value={coordinatorId} onValueChange={setCoordinatorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select coordinator" />
              </SelectTrigger>
              <SelectContent>
                {coordinators.map((coord) => (
                  <SelectItem key={coord.id} value={coord.id}>
                    {coord.name} (Ward {coord.ward})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Wards (Multiple)</Label>
            <div className="grid grid-cols-4 gap-2 p-4 border rounded-md">
              {wardOptions.map((wardNum) => (
                <div key={wardNum} className="flex items-center space-x-2">
                  <Checkbox
                    id={`ward-${wardNum}`}
                    checked={selectedWards.includes(wardNum)}
                    onCheckedChange={(checked) => handleWardChange(wardNum, checked as boolean)}
                  />
                  <Label htmlFor={`ward-${wardNum}`} className="text-sm">
                    Ward {wardNum}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Supervisor"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};