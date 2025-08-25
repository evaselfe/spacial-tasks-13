import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { checkMobileDuplicate, getTableDisplayName } from "@/lib/mobileValidation";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  team_id: string;
  name: string;
  mobile: string;
  role: string;
  joined_at: string;
}

interface TeamMemberFormProps {
  teamId: string;
  member?: TeamMember | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const memberRoles = [
  "Admin",
  "Team member",
  "Coordinator",
  "Supervisor",
  "Group leader",
  "PRO"
];

export const TeamMemberForm = ({ teamId, member, onSuccess, onCancel }: TeamMemberFormProps) => {
  const [name, setName] = useState(member?.name || "");
  const [mobile, setMobile] = useState(member?.mobile || "");
  const [role, setRole] = useState(member?.role || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!member;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !mobile.trim() || !role) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    // Basic mobile number validation
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile.replace(/\s/g, ''))) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check for duplicate email/mobile number in team_members table
      const { data: existingMembers, error: checkError } = await supabase
        .from('team_members')
        .select('id, email')
        .eq('email', mobile)
        .neq('id', member?.id || '');

      if (checkError) throw checkError;

      if (existingMembers && existingMembers.length > 0) {
        toast({
          title: "Error",
          description: "This email/mobile is already registered in team members",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (isEditing) {
        const { error } = await supabase
          .from('team_members')
          .update({ 
            name, 
            email: mobile, // Using email field to store mobile
            role 
          })
          .eq('id', member.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_members')
          .insert({ 
            team_id: teamId, 
            name, 
            email: mobile, // Using email field to store mobile
            role 
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Team member ${isEditing ? "updated" : "added"} successfully`,
      });

      onSuccess();
    } catch (error) {
      console.error(`Error ${isEditing ? "updating" : "adding"} team member:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} team member`,
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
            {isEditing ? "Edit Team Member" : "Add Team Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the team member information below."
              : "Fill in the details to add a new team member."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobile">Email/Mobile *</Label>
            <Input
              id="mobile"
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter email or mobile number"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {memberRoles.map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    {roleOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {loading ? "Saving..." : (isEditing ? "Update Member" : "Add Member")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};