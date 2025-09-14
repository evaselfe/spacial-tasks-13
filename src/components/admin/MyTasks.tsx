import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, MessageSquare, RefreshCcw } from "lucide-react";
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
  assigned_to?: string | null;
  reassigned_to_coordinator?: string | null;
  reassigned_to_supervisor?: string | null;
  reassigned_coordinator?: {
    id: string;
    name: string;
    mobile_number: string;
  } | null;
  reassigned_supervisor?: {
    id: string;
    name: string;
    mobile_number: string;
  } | null;
  assigned_by?: {
    id: string;
    name: string;
    mobile_number: string;
  } | null;
}

interface Assignee {
  id: string;
  name: string;
  mobile: string;
  type: 'coordinator' | 'supervisor';
}

export const MyTasks = ({ userId, userRole, userTable }: MyTasksProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [newRemarks, setNewRemarks] = useState("");
  const [reassigningTask, setReassigningTask] = useState<string | null>(null);
  const [selectedReassignee, setSelectedReassignee] = useState<string>('unassigned');
  const [reassigneeType, setReassigneeType] = useState<'coordinator' | 'supervisor'>('coordinator');
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        let query = supabase.from('todos').select('*');
        
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
        
        // Get reassigned coordinators/supervisors separately
        const tasksWithAssignees = await Promise.all(
          (data || []).map(async (task) => {
            let reassigned_coordinator = null;
            let reassigned_supervisor = null;
            let assigned_by = null;
            const taskAny = task as any;

            if (taskAny.reassigned_to_coordinator) {
              const { data: coordinatorData } = await supabase
                .from('coordinators')
                .select('id, name, mobile_number')
                .eq('id', taskAny.reassigned_to_coordinator)
                .single();
              reassigned_coordinator = coordinatorData;
            }

            if (taskAny.reassigned_to_supervisor) {
              const { data: supervisorData } = await supabase
                .from('supervisors')
                .select('id, name, mobile_number')
                .eq('id', taskAny.reassigned_to_supervisor)
                .single();
              reassigned_supervisor = supervisorData;
            }

            // For agents, get the team member who assigned the task
            if ((userRole === 'coordinator' || userRole === 'supervisor') && taskAny.assigned_to) {
              const { data: teamMemberData } = await supabase
                .from('admin_members')
                .select('id, name, mobile_number')
                .eq('id', taskAny.assigned_to)
                .single();
              assigned_by = teamMemberData;
            }

            return {
              id: task.id,
              text: task.text,
              status: task.status as TaskStatus,
              remarks: task.remarks,
              created_at: task.created_at,
              finished_at: task.finished_at,
              assigned_to: taskAny.assigned_to || null,
              reassigned_to_coordinator: taskAny.reassigned_to_coordinator || null,
              reassigned_to_supervisor: taskAny.reassigned_to_supervisor || null,
              reassigned_coordinator,
              reassigned_supervisor,
              assigned_by
            };
          })
        );
        
        setTasks(tasksWithAssignees);
      } catch (err) {
        console.error('Error fetching assigned tasks:', err);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    const loadAssignees = async () => {
      try {
        const allAssignees: Assignee[] = [];

        // Load coordinators
        const { data: coordinatorData, error: coordinatorError } = await supabase
          .from('coordinators')
          .select('id, name, mobile_number')
          .order('name');

        if (!coordinatorError && coordinatorData) {
          allAssignees.push(...coordinatorData.map((coordinator: any) => ({
            id: coordinator.id,
            name: coordinator.name,
            mobile: coordinator.mobile_number,
            type: 'coordinator' as const
          })));
        }

        // Load supervisors
        const { data: supervisorData, error: supervisorError } = await supabase
          .from('supervisors')
          .select('id, name, mobile_number')
          .order('name');

        if (!supervisorError && supervisorData) {
          allAssignees.push(...supervisorData.map((supervisor: any) => ({
            id: supervisor.id,
            name: supervisor.name,
            mobile: supervisor.mobile_number,
            type: 'supervisor' as const
          })));
        }

        setAssignees(allAssignees);
      } catch (error) {
        console.error('Error loading assignees:', error);
      }
    };

    if (userId) {
      fetchTasks();
      loadAssignees();
    }
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

  const handleReassignTask = async (taskId: string, assigneeId: string | null, type: 'coordinator' | 'supervisor') => {
    try {
      const updateData: any = {};
      
      if (type === 'coordinator') {
        updateData.reassigned_to_coordinator = assigneeId;
        updateData.reassigned_to_supervisor = null;
      } else {
        updateData.reassigned_to_supervisor = assigneeId;
        updateData.reassigned_to_coordinator = null;
      }
      
      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('Reassignment error details:', error);
        
        if (error.message.includes('reassigned_to') || error.message.includes('column') || error.code === '42703') {
          toast({
            title: "Database Update Required",
            description: `Please run the SQL script 'add_reassigned_to_column.sql' to add reassignment columns. Error: ${error.message}`,
            variant: "destructive",
          });
          return;
        }
        throw error;
      }
      
      // Refresh tasks to get updated data
      const fetchTasks = async () => {
        try {
          let query = supabase.from('todos').select('*');
          
          if (userTable === 'admin_members') {
            query = query.filter('assigned_to', 'eq', userId);
          } else if (userRole === 'coordinator') {
            query = query.filter('reassigned_to_coordinator', 'eq', userId);
          } else if (userRole === 'supervisor') {
            query = query.filter('reassigned_to_supervisor', 'eq', userId);
          } else {
            query = query.filter('assigned_to', 'eq', userId);
          }

          const { data, error } = await query.order('created_at', { ascending: false });
          if (error) throw error;
          
          const tasksWithAssignees = await Promise.all(
            (data || []).map(async (task) => {
              let reassigned_coordinator = null;
              let reassigned_supervisor = null;
              let assigned_by = null;
              const taskAny = task as any;

              if (taskAny.reassigned_to_coordinator) {
                const { data: coordinatorData } = await supabase
                  .from('coordinators')
                  .select('id, name, mobile_number')
                  .eq('id', taskAny.reassigned_to_coordinator)
                  .single();
                reassigned_coordinator = coordinatorData;
              }

              if (taskAny.reassigned_to_supervisor) {
                const { data: supervisorData } = await supabase
                  .from('supervisors')
                  .select('id, name, mobile_number')
                  .eq('id', taskAny.reassigned_to_supervisor)
                  .single();
                reassigned_supervisor = supervisorData;
              }

              // For agents, get the team member who assigned the task
              if ((userRole === 'coordinator' || userRole === 'supervisor') && taskAny.assigned_to) {
                const { data: teamMemberData } = await supabase
                  .from('admin_members')
                  .select('id, name, mobile_number')
                  .eq('id', taskAny.assigned_to)
                  .single();
                assigned_by = teamMemberData;
              }

              return {
                id: task.id,
                text: task.text,
                status: task.status as TaskStatus,
                remarks: task.remarks,
                created_at: task.created_at,
                finished_at: task.finished_at,
                assigned_to: taskAny.assigned_to || null,
                reassigned_to_coordinator: taskAny.reassigned_to_coordinator || null,
                reassigned_to_supervisor: taskAny.reassigned_to_supervisor || null,
                reassigned_coordinator,
                reassigned_supervisor,
                assigned_by
              };
            })
          );
          
          setTasks(tasksWithAssignees);
        } catch (err) {
          console.error('Error fetching tasks after reassignment:', err);
        }
      };

      await fetchTasks();
      setReassigningTask(null);
      setSelectedReassignee('unassigned');
      setAssigneeSearchTerm('');
      
      toast({
        title: "Success",
        description: assigneeId ? `Task reassigned to ${type} successfully` : "Task reassignment removed",
      });
    } catch (error) {
      console.error('Error reassigning task:', error);
      toast({
        title: "Error",
        description: "Failed to reassign task. Make sure database is properly configured.",
        variant: "destructive",
      });
    }
  };

  const openRemarksDialog = (task: Task) => {
    setEditingTask(task.id);
    setNewRemarks(task.remarks || "");
  };

  const startReassigning = (task: Task) => {
    setReassigningTask(task.id);
    setAssigneeSearchTerm('');
    
    // Set the current assignment as the selected value
    if (task.reassigned_to_coordinator) {
      setSelectedReassignee(task.reassigned_to_coordinator);
      setReassigneeType('coordinator');
    } else if (task.reassigned_to_supervisor) {
      setSelectedReassignee(task.reassigned_to_supervisor);
      setReassigneeType('supervisor');
    } else {
      setSelectedReassignee('unassigned');
      setReassigneeType('coordinator');
    }
  };

  const cancelReassigning = () => {
    setReassigningTask(null);
    setSelectedReassignee('unassigned');
    setAssigneeSearchTerm('');
  };

  const confirmReassignTask = () => {
    if (!reassigningTask) return;
    const assigneeToReassign = selectedReassignee === "unassigned" ? null : selectedReassignee || null;
    handleReassignTask(reassigningTask, assigneeToReassign, reassigneeType);
  };

  // Filter assignees based on search term and type
  const filteredAssignees = assignees.filter(assignee => 
    assignee.type === reassigneeType &&
    (assignee.name.toLowerCase().includes(assigneeSearchTerm.toLowerCase()) ||
     assignee.mobile.includes(assigneeSearchTerm))
  );

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
          {(task.reassigned_coordinator || task.reassigned_supervisor) && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {userTable === 'admin_members' ? (
                  // For team members: show "Reassigned to"
                  task.reassigned_coordinator ? (
                    <>Reassigned to <span className="text-primary font-medium">{task.reassigned_coordinator.name}</span> ({task.reassigned_coordinator.mobile_number})</>
                  ) : (
                    <>Reassigned to <span className="text-primary font-medium">{task.reassigned_supervisor?.name}</span> ({task.reassigned_supervisor?.mobile_number})</>
                  )
                ) : (
                  // For agents: show "Reassigned from team member"
                  <>Reassigned from <span className="text-secondary font-medium">{task.assigned_by?.name || 'Team Member'}</span> {task.assigned_by?.mobile_number && `(${task.assigned_by.mobile_number})`}</>
                )}
              </Badge>
            </div>
          )}
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
              className="h-8 w-8 p-0 text-primary hover:text-primary/80"
              title="Add/Edit Remarks"
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
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startReassigning(task)}
          className="h-8 w-8 p-0 text-secondary hover:text-secondary/80"
          title={task.reassigned_coordinator || task.reassigned_supervisor ? "Change Reassignment" : "Reassign Task"}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
        
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

      {/* Reassign Task Dialog */}
      <Dialog open={!!reassigningTask} onOpenChange={() => setReassigningTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Task to Coordinator/Supervisor</DialogTitle>
            <DialogDescription>
              Reassign this task to a coordinator or supervisor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reassign Type:</label>
              <Select value={reassigneeType} onValueChange={(value: 'coordinator' | 'supervisor') => setReassigneeType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {reassigneeType === 'coordinator' ? 'Select Coordinator:' : 'Select Supervisor:'}
              </label>
              <div className="space-y-2">
                <Input
                  placeholder={`Search ${reassigneeType}s by name or mobile...`}
                  value={assigneeSearchTerm}
                  onChange={(e) => setAssigneeSearchTerm(e.target.value)}
                />
                <Select value={selectedReassignee} onValueChange={setSelectedReassignee}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${reassigneeType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Remove Reassignment</SelectItem>
                    {filteredAssignees.map(assignee => (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{assignee.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {assignee.mobile}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelReassigning}>
              Cancel
            </Button>
            <Button onClick={confirmReassignTask}>
              {selectedReassignee === 'unassigned' ? 'Remove Reassignment' : 'Reassign Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};