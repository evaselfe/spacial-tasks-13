import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface TeamMember {
  id: string;
  team_id: string;
  name: string;
  email: string;
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
  "Team Lead",
  "Developer",
  "Designer",
  "Analyst",
  "Manager",
  "Coordinator",
  "Member"
];

export const TeamMemberForm = ({ teamId, member, onSuccess, onCancel }: TeamMemberFormProps) => {
  const [name, setName] = useState(member?.name || "");
  const [email, setEmail] = useState(member?.email || "");
  const [role, setRole] = useState(member?.role || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!member;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !role) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement actual team member creation/update when team_members table exists
      // For now, we'll simulate the operation
      
      if (isEditing) {
        // Simulate team member update
        console.log("Updating team member:", { 
          id: member.id, 
          team_id: teamId, 
          name, 
          email, 
          role 
        });
      } else {
        // Simulate team member creation
        console.log("Adding team member:", { 
          team_id: teamId, 
          name, 
          email, 
          role 
        });
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
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
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