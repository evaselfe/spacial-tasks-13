import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { checkMobileDuplicate, getTableDisplayName } from "@/lib/mobileValidation";

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
      // Check for duplicate mobile number
      const duplicateCheck = await checkMobileDuplicate(mobile, member?.id, 'team_members');
      if (duplicateCheck.isDuplicate) {
        toast({
          title: "Error",
          description: `This mobile number is already registered in ${getTableDisplayName(duplicateCheck.table!)}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // TODO: Implement actual team member creation/update when team_members table exists
      // For now, we'll simulate the operation
      
      if (isEditing) {
        // Simulate team member update
        console.log("Updating team member:", { 
          id: member.id, 
          team_id: teamId, 
          name, 
          mobile, 
          role 
        });
      } else {
        // Simulate team member creation
        console.log("Adding team member:", { 
          team_id: teamId, 
          name, 
          mobile, 
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
            <Label htmlFor="mobile">Mobile Number *</Label>
            <Input
              id="mobile"
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Enter mobile number"
              maxLength={10}
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