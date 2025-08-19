import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProFormProps {
  panchayath: any;
}

export const ProForm = ({ panchayath }: ProFormProps) => {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [ward, setWard] = useState("");
  const [groupLeaderId, setGroupLeaderId] = useState("");
  const [groupLeaders, setGroupLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (ward) {
      fetchGroupLeadersForWard(parseInt(ward));
    } else {
      setGroupLeaders([]);
      setGroupLeaderId("");
    }
  }, [ward, panchayath.id]);

  const fetchGroupLeadersForWard = async (wardNum: number) => {
    try {
      const { data, error } = await supabase
        .from("group_leaders")
        .select("*")
        .eq("panchayath_id", panchayath.id)
        .eq("ward", wardNum);

      if (error) throw error;
      setGroupLeaders(data || []);
    } catch (error) {
      console.error("Error fetching group leaders:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !ward || !groupLeaderId) {
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
        .from("pros")
        .insert({
          panchayath_id: panchayath.id,
          group_leader_id: groupLeaderId,
          name: name.trim(),
          mobile_number: mobile.trim(),
          ward: wardNum,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "PRO added successfully",
      });
      
      setName("");
      setMobile("");
      setWard("");
      setGroupLeaderId("");
    } catch (error: any) {
      console.error("Error adding PRO:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add PRO",
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
        <CardTitle>Add PRO</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pro-name">Name</Label>
              <Input
                id="pro-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pro-mobile">Mobile Number</Label>
              <Input
                id="pro-mobile"
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
              <Label>Select Group Leader</Label>
              <Select value={groupLeaderId} onValueChange={setGroupLeaderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group leader for this ward" />
                </SelectTrigger>
                <SelectContent>
                  {groupLeaders.map((leader) => (
                    <SelectItem key={leader.id} value={leader.id}>
                      {leader.name} ({leader.mobile_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add PRO"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};