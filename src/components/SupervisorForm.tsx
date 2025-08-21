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
  selectedPanchayath?: any;
}

export const SupervisorForm = ({ selectedPanchayath: preSelectedPanchayath }: SupervisorFormProps) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [selectedWards, setSelectedWards] = useState<number[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [panchayathId, setPanchayathId] = useState("");
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
    if (panchayathId) {
      const panchayath = panchayaths.find(p => p.id === panchayathId);
      setSelectedPanchayath(panchayath);
      fetchCoordinators();
      setSelectedWards([]); // Reset wards when panchayath changes
      setCoordinatorId("");
    } else {
      setSelectedPanchayath(null);
      setCoordinators([]);
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

  const fetchCoordinators = async () => {
    if (!panchayathId) return;
    
    try {
      const { data, error } = await supabase
        .from("coordinators")
        .select("*")
        .eq("panchayath_id", panchayathId);

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
    if (!name.trim() || !mobile.trim() || !coordinatorId || selectedWards.length === 0 || !panchayathId) {
      toast({
        title: "Error",
        description: "Please fill in all fields, select a panchayath, and select at least one ward",
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

    setLoading(true);
    try {
      // Insert supervisor
      const { data: supervisor, error: supervisorError } = await supabase
        .from("supervisors")
        .insert({
          panchayath_id: panchayathId,
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
      setPanchayathId("");
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

  const wardOptions = selectedPanchayath ? Array.from({ length: selectedPanchayath.number_of_wards }, (_, i) => i + 1) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Supervisor</CardTitle>
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
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(value);
                }}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Select Coordinator</Label>
            <Select value={coordinatorId} onValueChange={setCoordinatorId} disabled={!selectedPanchayath}>
              <SelectTrigger>
                <SelectValue placeholder={selectedPanchayath ? "Select coordinator" : "Select panchayath first"} />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 border rounded-md max-h-40 overflow-y-auto">
              {selectedPanchayath ? wardOptions.map((wardNum) => (
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
              )) : (
                <p className="text-muted-foreground col-span-2 md:col-span-4">Select a panchayath first</p>
              )}
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