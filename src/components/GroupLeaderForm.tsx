import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GroupLeaderFormProps {
  panchayath: any;
}

export const GroupLeaderForm = ({ panchayath }: GroupLeaderFormProps) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [ward, setWard] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (ward) {
      fetchSupervisorsForWard(parseInt(ward));
    } else {
      setSupervisors([]);
      setSupervisorId("");
    }
  }, [ward, panchayath.id]);

  const fetchSupervisorsForWard = async (wardNum: number) => {
    try {
      const { data, error } = await supabase
        .from("supervisors")
        .select(`
          *,
          supervisor_wards!inner(ward)
        `)
        .eq("panchayath_id", panchayath.id)
        .eq("supervisor_wards.ward", wardNum);

      if (error) throw error;
      setSupervisors(data || []);
    } catch (error) {
      console.error("Error fetching supervisors:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !ward || !supervisorId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const wardNum = parseInt(ward);
    if (isNaN(wardNum) || wardNum < 1 || wardNum > panchayath.number_of_wards) {
      toast({
        title: "Error",
        description: `Ward must be between 1 and ${panchayath.number_of_wards}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("group_leaders")
        .insert({
          panchayath_id: panchayath.id,
          supervisor_id: supervisorId,
          name: name.trim(),
          mobile_number: mobile.trim(),
          ward: wardNum,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Group Leader added successfully",
      });
      
      setName("");
      setMobile("");
      setWard("");
      setSupervisorId("");
    } catch (error: any) {
      console.error("Error adding group leader:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add group leader",
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
        <CardTitle>Add Group Leader</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gl-name">Name</Label>
              <Input
                id="gl-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gl-mobile">Mobile Number</Label>
              <Input
                id="gl-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter mobile number"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Select Ward</Label>
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

          {ward && (
            <div className="space-y-2">
              <Label>Select Supervisor</Label>
              <Select value={supervisorId} onValueChange={setSupervisorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor for this ward" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.name} ({supervisor.mobile_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Group Leader"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};