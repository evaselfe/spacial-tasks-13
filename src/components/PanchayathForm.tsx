import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface PanchayathFormProps {
  officerId: string;
  onPanchayathCreated: (panchayath: any) => void;
  editingPanchayath?: any;
  onEditComplete?: () => void;
  onPanchayathDeleted?: (panchayathId: string) => void;
}

export const PanchayathForm = ({ officerId, onPanchayathCreated, editingPanchayath, onEditComplete, onPanchayathDeleted }: PanchayathFormProps) => {
  const [name, setName] = useState(editingPanchayath?.name || "");
  const [wards, setWards] = useState(editingPanchayath?.number_of_wards?.toString() || "");
  const [loading, setLoading] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { toast } = useToast();

  // Update form when editing different panchayath
  useEffect(() => {
    setName(editingPanchayath?.name || "");
    setWards(editingPanchayath?.number_of_wards?.toString() || "");
  }, [editingPanchayath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !wards.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const wardCount = parseInt(wards);
    if (isNaN(wardCount) || wardCount <= 0) {
      toast({
        title: "Error",
        description: "Number of wards must be a positive number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let data, error;
      
      if (editingPanchayath) {
        // Update existing panchayath
        const { error } = await supabase
          .from("panchayaths")
          .update({
            name: name.trim(),
            number_of_wards: wardCount,
          })
          .eq('id', editingPanchayath.id);
          
        if (error) throw error;
        
        // Create the updated data object manually
        data = { ...editingPanchayath, name: name.trim(), number_of_wards: wardCount };
      } else {
        // Create new panchayath
        const result = await supabase
          .from("panchayaths")
          .insert({
            name: name.trim(),
            number_of_wards: wardCount,
            created_by: officerId,
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: editingPanchayath ? "Panchayath updated successfully" : "Panchayath created successfully",
      });
      
      onPanchayathCreated(data);
      
      if (editingPanchayath && onEditComplete) {
        onEditComplete();
      } else {
        setName("");
        setWards("");
      }
    } catch (error: any) {
      console.error("Error saving panchayath:", error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingPanchayath ? 'update' : 'create'} panchayath`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteCode !== "8593919123") {
      toast({
        title: "Error",
        description: "Invalid delete code",
        variant: "destructive",
      });
      return;
    }

    if (!editingPanchayath) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from("panchayaths")
        .delete()
        .eq('id', editingPanchayath.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Panchayath deleted successfully",
      });

      if (onPanchayathDeleted) {
        onPanchayathDeleted(editingPanchayath.id);
      }
      
      if (onEditComplete) {
        onEditComplete();
      }
    } catch (error: any) {
      console.error("Error deleting panchayath:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete panchayath",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteCode("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editingPanchayath ? 'Edit Panchayath' : 'Create New Panchayath'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="panchayath-name">Panchayath Name</Label>
            <Input
              id="panchayath-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter panchayath name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ward-count">Number of Wards</Label>
            <Input
              id="ward-count"
              type="number"
              value={wards}
              onChange={(e) => setWards(e.target.value)}
              placeholder="Enter number of wards"
              min="1"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? (editingPanchayath ? "Updating..." : "Creating...") : (editingPanchayath ? "Update Panchayath" : "Create Panchayath")}
            </Button>
            {editingPanchayath && onEditComplete && (
              <Button type="button" variant="outline" onClick={onEditComplete}>
                Cancel
              </Button>
            )}
            {editingPanchayath && onPanchayathDeleted && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Panchayath</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Please enter the delete code to confirm deletion of "{editingPanchayath?.name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="delete-code">Delete Code</Label>
                    <Input
                      id="delete-code"
                      type="text"
                      value={deleteCode}
                      onChange={(e) => setDeleteCode(e.target.value)}
                      placeholder="Enter delete code"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteCode("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleteLoading || deleteCode !== "8593919123"}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading ? "Deleting..." : "Delete Panchayath"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};