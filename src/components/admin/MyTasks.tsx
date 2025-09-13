import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Clock, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MyTasksProps {
  userId: string;
  userRole?: string;
  userTable?: string;
}

type TaskStatus = 'finished' | 'unfinished';

interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  remarks: string | null;
  created_at: string;
  finished_at?: string | null;
}

export const MyTasks = ({ userId, userRole, userTable }: MyTasksProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [newRemarks, setNewRemarks] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        let query = supabase.from('todos').select('id, text, status, remarks, created_at, finished_at');
        
        // For team members (admin_members table), show assigned tasks
        if (userTable === 'admin_members') {
          query = query.filter('assigned_to', 'eq', userId);
        }
        // For coordinators, show tasks reassigned to them
        else if (userRole === 'coordinator') {
          query = query.filter('reassigned_to_coordinator', 'eq', userId);
        }
        // For supervisors, show tasks reassigned to them
        else if (userRole === 'supervisor') {
          query = query.filter('reassigned_to_supervisor', 'eq', userId);
        }
        // Fallback: try to match by assigned_to
        else {
          query = query.filter('assigned_to', 'eq', userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        setTasks((data || []) as Task[]);
      } catch (err) {
        console.error('Error fetching assigned tasks:', err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchTasks();
  }, [userId, userRole, userTable]);

  const handleUpdateRemarks = async (taskId: string, remarks: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ remarks })
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, remarks } : task
      ));

      setEditingTask(null);
      setNewRemarks("");

      toast({
        title: "Remarks updated",
        description: "Your remarks have been saved successfully."
      });
    } catch (error) {
      console.error('Error updating remarks:', error);
      toast({
        title: "Error",
        description: "Failed to update remarks. Please try again.",
        variant: "destructive"
      });
    }
  };

  const openRemarksDialog = (task: Task) => {
    setEditingTask(task.id);
    setNewRemarks(task.remarks || "");
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card mb-2">
      <div className="flex items-start gap-3 flex-1">
        {task.status === 'finished' ? (
          <CheckCircle className="h-5 w-5 text-primary" />
        ) : (
          <Clock className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="flex-1">
          <p className="font-medium text-foreground">{task.text}</p>
          {task.remarks && <p className="text-sm text-muted-foreground mt-1">{task.remarks}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(task.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Dialog open={editingTask === task.id} onOpenChange={(open) => !open && setEditingTask(null)}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openRemarksDialog(task)}
              className="h-8 w-8 p-0"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add/Edit Remarks</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Task:</p>
                <p className="text-sm text-muted-foreground">{task.text}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Remarks:</label>
                <Textarea
                  value={newRemarks}
                  onChange={(e) => setNewRemarks(e.target.value)}
                  placeholder="Add your remarks here..."
                  className="mt-2"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateRemarks(task.id, newRemarks)}
                >
                  Save Remarks
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Badge variant={task.status === 'finished' ? 'secondary' : 'outline'}>
          {task.status === 'finished' ? 'Finished' : 'Pending'}
        </Badge>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Your Assigned Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingTasks = tasks.filter(task => task.status === 'unfinished');
  const finishedTasks = tasks.filter(task => task.status === 'finished');

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          {userTable === 'admin_members' ? 'Your Assigned Tasks' : 'Your Reassigned Tasks'} ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {userTable === 'admin_members' ? 'No tasks assigned to you yet.' : 'No tasks reassigned to you yet.'}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {userTable === 'admin_members' 
                ? 'Tasks will appear here when administrators assign them to you.'
                : 'Tasks will appear here when they are reassigned to you.'
              }
            </p>
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="finished" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Finished ({finishedTasks.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-4">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending tasks.</p>
                </div>
              ) : (
                <div>
                  {pendingTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="finished" className="mt-4">
              {finishedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No finished tasks.</p>
                </div>
              ) : (
                <div>
                  {finishedTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};