import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdminTeam {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface AdminTeamFormProps {
  team?: AdminTeam | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminTeamForm = ({ team, onSuccess, onCancel }: AdminTeamFormProps) => {
  const [name, setName] = useState(team?.name || "");
  const [description, setDescription] = useState(team?.description || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!team;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const { error } = await supabase
          .from('admin_teams')
          .update({ name: name.trim(), description: description.trim() || null })
          .eq('id', team!.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_teams')
          .insert([{ name: name.trim(), description: description.trim() || null }]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Admin team ${isEditing ? "updated" : "created"} successfully`,
      });

      onSuccess();
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "creating"} admin team:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "create"} admin team`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Admin Team" : "Create New Admin Team"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the admin team information below."
              : "Fill in the details to create a new admin team."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter admin team name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter team description (optional)"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : (isEditing ? "Update Team" : "Create Team")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};