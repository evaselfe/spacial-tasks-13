import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, MapPin, Users, Eye, EyeOff } from "lucide-react";

interface PanchayathSelectorProps {
  onPanchayathSelect: (panchayath: any) => void;
  onPanchayathEdit: (panchayath: any) => void;
}

export const PanchayathSelector = ({ onPanchayathSelect, onPanchayathEdit }: PanchayathSelectorProps) => {
  const [panchayaths, setPanchayaths] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPanchayaths, setShowPanchayaths] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPanchayaths();
  }, []);

  const fetchPanchayaths = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("panchayaths")
        .select(`
          *,
          coordinators(count),
          supervisors(count),
          group_leaders(count),
          pros(count)
        `)
        .order("name");

      if (error) throw error;
      setPanchayaths(data || []);
    } catch (error) {
      console.error("Error fetching panchayaths:", error);
      toast({
        title: "Error",
        description: "Failed to fetch panchayaths",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    const selected = panchayaths.find(p => p.id === selectedId);
    if (selected) {
      onPanchayathSelect(selected);
      toast({
        title: "Success",
        description: `Selected ${selected.name} for management`,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Label htmlFor="show-panchayaths" className="flex items-center gap-2 text-sm font-medium">
            {showPanchayaths ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Show Panchayaths
          </Label>
          <Switch
            id="show-panchayaths"
            checked={showPanchayaths}
            onCheckedChange={setShowPanchayaths}
          />
        </div>

        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a panchayath to manage" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-lg">
            {panchayaths.map((panchayath) => (
              <SelectItem key={panchayath.id} value={panchayath.id}>
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{panchayath.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {panchayath.number_of_wards} wards
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedId && (
          <Button onClick={handleSelect} className="w-full">
            Select Panchayath
          </Button>
        )}
      </div>

      {showPanchayaths && panchayaths.length > 0 && (
        <div className="grid gap-4">
          <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Available Panchayaths
          </h4>
          <div className="grid gap-3">
            {panchayaths.map((panchayath) => (
              <Card 
                key={panchayath.id} 
                className="cursor-pointer transition-all hover:shadow-md border border-border/50 hover:border-primary/40"
                onClick={() => setSelectedId(panchayath.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-primary">{panchayath.name}</h5>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {panchayath.number_of_wards} wards
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {(panchayath.coordinators?.[0]?.count || 0) + (panchayath.supervisors?.[0]?.count || 0) + (panchayath.group_leaders?.[0]?.count || 0) + (panchayath.pros?.[0]?.count || 0)} total
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs bg-coordinator/10 text-coordinator border-coordinator/20">
                          <div className="h-2 w-2 rounded-full bg-coordinator mr-1"></div>
                          {panchayath.coordinators?.[0]?.count || 0} C
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-supervisor/10 text-supervisor border-supervisor/20">
                          <div className="h-2 w-2 rounded-full bg-supervisor mr-1"></div>
                          {panchayath.supervisors?.[0]?.count || 0} S
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-group-leader/10 text-group-leader border-group-leader/20">
                          <div className="h-2 w-2 rounded-full bg-group-leader mr-1"></div>
                          {panchayath.group_leaders?.[0]?.count || 0} GL
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-pro/10 text-pro border-pro/20">
                          <div className="h-2 w-2 rounded-full bg-pro mr-1"></div>
                          {panchayath.pros?.[0]?.count || 0} P
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPanchayathEdit(panchayath);
                        }}
                        className="ml-2 hover:bg-primary hover:text-primary-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};