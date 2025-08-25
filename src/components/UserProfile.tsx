import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkMobileDuplicate, getTableDisplayName } from "@/lib/mobileValidation";
interface UserProfileProps {
  currentOfficer: any;
  onOfficerUpdate: (officer: any) => void;
}
export const UserProfile = ({
  currentOfficer,
  onOfficerUpdate
}: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentOfficer?.name || "");
  const [mobile, setMobile] = useState(currentOfficer?.mobile_number || "");
  const [loading, setLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      // Check for duplicate mobile number
      const duplicateCheck = await checkMobileDuplicate(mobile, currentOfficer.id, 'officers');
      if (duplicateCheck.isDuplicate) {
        toast({
          title: "Error",
          description: `This mobile number is already registered in ${getTableDisplayName(duplicateCheck.table!)}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const {
        data,
        error
      } = await supabase.from("officers").update({
        name: name.trim(),
        mobile_number: mobile.trim()
      }).eq("id", currentOfficer.id).select().single();
      if (error) throw error;
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      onOfficerUpdate(data);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setName(currentOfficer?.name || "");
    setMobile(currentOfficer?.mobile_number || "");
  };
  return <Card className="w-full max-w-sm">
      <CardHeader className="pb-3 bg-teal-300">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          Officer Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-sm font-medium">{currentOfficer?.name}</p>
          <p className="text-xs text-muted-foreground">{currentOfficer?.mobile_number}</p>
        </div>
        
        <Dialog open={isEditing} onOpenChange={open => {
        setIsEditing(open);
        if (!open) resetForm();
      }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="h-3 w-3 mr-2" />
              Edit Profile
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-mobile">Mobile Number</Label>
                <Input id="edit-mobile" type="tel" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Enter mobile number" required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Updating..." : "Update"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>;
};