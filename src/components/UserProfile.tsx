import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, getRoleDisplayName } from "@/lib/authService";
import { supabase } from "@/integrations/supabase/client";
import { checkMobileDuplicate, getTableDisplayName } from "@/lib/mobileValidation";
import { Edit, User as UserIcon, Phone, Shield } from "lucide-react";

interface UserProfileProps {
  currentUser: User;
  onUserUpdate: (user: User) => void;
}

export const UserProfile = ({ currentUser, onUserUpdate }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [mobile, setMobile] = useState(currentUser.mobile_number);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check for duplicate mobile number if it's changed
      if (mobile !== currentUser.mobile_number) {
        const duplicateCheck = await checkMobileDuplicate(mobile, currentUser.id, currentUser.table);
        if (duplicateCheck.isDuplicate) {
          toast({
            title: "Mobile number already exists",
            description: `This mobile number is already registered with ${getTableDisplayName(duplicateCheck.table!)}`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Update the user in their respective table
      let error: any = null;
      
      if (currentUser.table === 'admin_members') {
        const { error: updateError } = await supabase
          .from('admin_members')
          .update({ name, mobile })
          .eq('id', currentUser.id);
        error = updateError;
      } else if (currentUser.table === 'coordinators') {
        const { error: updateError } = await supabase
          .from('coordinators')
          .update({ name, mobile_number: mobile })
          .eq('id', currentUser.id);
        error = updateError;
      } else if (currentUser.table === 'supervisors') {
        const { error: updateError } = await supabase
          .from('supervisors')
          .update({ name, mobile_number: mobile })
          .eq('id', currentUser.id);
        error = updateError;
      } else if (currentUser.table === 'group_leaders') {
        const { error: updateError } = await supabase
          .from('group_leaders')
          .update({ name, mobile_number: mobile })
          .eq('id', currentUser.id);
        error = updateError;
      } else if (currentUser.table === 'pros') {
        const { error: updateError } = await supabase
          .from('pros')
          .update({ name, mobile_number: mobile })
          .eq('id', currentUser.id);
        error = updateError;
      }

      if (error) throw error;

      // Update the current user state
      const updatedUser = {
        ...currentUser,
        name,
        mobile_number: mobile
      };
      
      onUserUpdate(updatedUser);
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{currentUser.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="w-3 h-3" />
              {currentUser.mobile_number}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs">
            {currentUser.hasAdminAccess && <Shield className="w-3 h-3 text-primary" />}
            <span className="text-muted-foreground">
              {getRoleDisplayName(currentUser.role)}
            </span>
          </div>
          
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Update your profile information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-mobile">Mobile Number</Label>
                  <Input
                    id="edit-mobile"
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};