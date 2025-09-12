import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle, XCircle, Plus, Edit, Save, X, Calendar as CalendarIcon, Clock, Trash2, Search, Users, UserCheck, Square, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  text: string;
  status: 'finished' | 'unfinished';
  remarks: string | null;
  created_at: string;
  finished_at?: string | null;
  assigned_to?: string | null;
  assigned_member?: {
    id: string;
    name: string;
    mobile: string;
  } | null;
}

interface AdminMember {
  id: string;
  name: string;
  mobile: string;
  team_id: string;
  role: string;
  panchayath: string;
}

export const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskType, setTaskType] = useState<'single' | 'multi'>('single');
  const [singleTaskText, setSingleTaskText] = useState('');
  const [multiTaskText, setMultiTaskText] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editRemarks, setEditRemarks] = useState('');
  const [finishingTask, setFinishingTask] = useState<string | null>(null);
  const [finishRemarks, setFinishRemarks] = useState('');
  const [activeTab, setActiveTab] = useState('unfinished');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [deletePasskey, setDeletePasskey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminMembers, setAdminMembers] = useState<AdminMember[]>([]);
  const [assigningTask, setAssigningTask] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>('unassigned');
  const [filterByAssignedTo, setFilterByAssignedTo] = useState<string>('all');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('unassigned');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<'delete' | 'finish' | 'edit' | null>(null);
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [bulkDeletePasskey, setBulkDeletePasskey] = useState('');
  const { toast } = useToast();

  // Load tasks from database
  useEffect(() => {
    loadTasks();
    loadAdminMembers();
  }, []);

  const loadTasks = async () => {
    try {
      console.log('Loading tasks...');
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Tasks loaded:', { data, error });

      if (error) throw error;
      
      // Get assigned members separately
      const tasksWithMembers = await Promise.all(
        (data || []).map(async (task) => {
          let assigned_member = null;
          const taskAny = task as any;
          if (taskAny.assigned_to) {
            const { data: memberData } = await supabase
              .from('admin_members')
              .select('id, name, mobile')
              .eq('id', taskAny.assigned_to)
              .single();
            assigned_member = memberData;
          }
          
          return {
            id: task.id,
            text: task.text,
            status: task.status as 'finished' | 'unfinished',
            remarks: task.remarks,
            created_at: task.created_at,
            finished_at: task.finished_at,
            assigned_to: taskAny.assigned_to || null,
            assigned_member
          };
        })
      );
      
      console.log('Typed tasks:', tasksWithMembers);
      setTasks(tasksWithMembers);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAdminMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_members')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setAdminMembers(data || []);
    } catch (error) {
      console.error('Error loading admin members:', error);
      toast({
        title: "Error",
        description: "Failed to load admin members",
        variant: "destructive",
      });
    }
  };

  const addSingleTask = async () => {
    if (!singleTaskText.trim()) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const assignedTo = newTaskAssignee === 'unassigned' ? null : newTaskAssignee;
      
      const { error } = await supabase
        .from('todos')
        .insert([{
          text: singleTaskText,
          status: 'unfinished',
          remarks: null,
          created_by: user?.id || null,
          assigned_to: assignedTo
        }]);

      if (error) throw error;
      
      setSingleTaskText('');
      setNewTaskAssignee('unassigned');
      await loadTasks();
      toast({
        title: "Success",
        description: "Task added successfully",
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const addMultiTasks = async () => {
    if (!multiTaskText.trim()) return;

    const taskTexts = multiTaskText.split(',').map(text => text.trim()).filter(text => text.length > 0);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const assignedTo = newTaskAssignee === 'unassigned' ? null : newTaskAssignee;
      
      const newTasks = taskTexts.map(text => ({
        text,
        status: 'unfinished' as const,
        remarks: null,
        created_by: user?.id || null,
        assigned_to: assignedTo
      }));

      const { error } = await supabase
        .from('todos')
        .insert(newTasks);

      if (error) throw error;
      
      setMultiTaskText('');
      setNewTaskAssignee('unassigned');
      await loadTasks();
      toast({
        title: "Success",
        description: `${taskTexts.length} tasks added successfully`,
      });
    } catch (error) {
      console.error('Error adding tasks:', error);
      toast({
        title: "Error",
        description: "Failed to add tasks",
        variant: "destructive",
      });
    }
  };

  const toggleTaskStatus = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === 'unfinished') {
      // Show popup for remarks when finishing
      setFinishingTask(taskId);
      setFinishRemarks(task.remarks || '');
    } else {
      // Mark as unfinished
      updateTaskStatus(taskId, 'unfinished', task.remarks || '');
    }
  };

  const updateTaskStatus = async (taskId: string, status: 'finished' | 'unfinished', remarks: string) => {
    try {
      const updateData: any = { 
        status, 
        remarks: remarks || null,
        finished_at: status === 'finished' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      
      await loadTasks();
      toast({
        title: "Success",
        description: `Task marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const confirmFinishTask = () => {
    if (!finishingTask) return;
    
    updateTaskStatus(finishingTask, 'finished', finishRemarks);
    setFinishingTask(null);
    setFinishRemarks('');
  };

  const updateTaskRemarks = async (taskId: string, remarks: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ remarks: remarks || null })
        .eq('id', taskId);

      if (error) throw error;
      
      await loadTasks();
      setEditingTask(null);
      setEditRemarks('');
      toast({
        title: "Success",
        description: "Remarks updated successfully",
      });
    } catch (error) {
      console.error('Error updating remarks:', error);
      toast({
        title: "Error",
        description: "Failed to update remarks",
        variant: "destructive",
      });
    }
  };

  const startEditingRemarks = (task: Task) => {
    setEditingTask(task.id);
    setEditRemarks(task.remarks || '');
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditRemarks('');
  };

  const cancelFinishing = () => {
    setFinishingTask(null);
    setFinishRemarks('');
  };

  const startDeleting = (taskId: string) => {
    setDeletingTask(taskId);
    setDeletePasskey('');
  };

  const cancelDeleting = () => {
    setDeletingTask(null);
    setDeletePasskey('');
  };

  const confirmDeleteTask = async () => {
    if (deletePasskey !== 's7025715877') {
      toast({
        title: "Error",
        description: "Invalid passkey",
        variant: "destructive",
      });
      return;
    }

    if (!deletingTask) return;

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', deletingTask);

      if (error) throw error;
      
      await loadTasks();
      setDeletingTask(null);
      setDeletePasskey('');
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const assignTaskToMember = async (taskId: string, memberId: string | null) => {
    try {
      // Try to update the assignment - this will work once the database column is added
      const updateData: any = { assigned_to: memberId };
      
      const { error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('Assignment error details:');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', JSON.stringify(error, null, 2));
        
        // If error is about missing column, show helpful message
        if (error.message.includes('assigned_to') || error.message.includes('column') || error.code === '42703' || error.code === '23503') {
          toast({
            title: "Database Update Required",
            description: `Please run the SQL script 'fix_foreign_key_constraint.sql' to fix task assignments. Error: ${error.message}`,
            variant: "destructive",
          });
          return;
        }
        throw error;
      }
      
      await loadTasks();
      setAssigningTask(null);
      setSelectedMember('unassigned');
      toast({
        title: "Success",
        description: memberId ? "Task assigned successfully" : "Task assignment removed",
      });
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: "Error",
        description: "Failed to assign task. Make sure database is properly configured.",
        variant: "destructive",
      });
    }
  };

  const startAssigning = (taskId: string, currentAssignment?: string) => {
    setAssigningTask(taskId);
    setSelectedMember(currentAssignment || 'unassigned');
  };

  const cancelAssigning = () => {
    setAssigningTask(null);
    setSelectedMember('unassigned');
  };

  const confirmAssignTask = () => {
    if (!assigningTask) return;
    const memberToAssign = selectedMember === "unassigned" ? null : selectedMember || null;
    assignTaskToMember(assigningTask, memberToAssign);
  };

  // Bulk action functions
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleSelectAll = (taskList: Task[]) => {
    const allTaskIds = taskList.map(task => task.id);
    const allSelected = allTaskIds.every(id => selectedTasks.includes(id));
    
    if (allSelected) {
      setSelectedTasks(prev => prev.filter(id => !allTaskIds.includes(id)));
    } else {
      setSelectedTasks(prev => [...prev, ...allTaskIds.filter(id => !prev.includes(id))]);
    }
  };

  const clearSelection = () => {
    setSelectedTasks([]);
  };

  const startBulkAction = (action: 'delete' | 'finish' | 'edit') => {
    if (selectedTasks.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select tasks to perform bulk action",
        variant: "destructive",
      });
      return;
    }
    setBulkAction(action);
    setBulkRemarks('');
    setBulkDeletePasskey('');
  };

  const cancelBulkAction = () => {
    setBulkAction(null);
    setBulkRemarks('');
    setBulkDeletePasskey('');
  };

  const confirmBulkDelete = async () => {
    if (bulkDeletePasskey !== 's7025715877') {
      toast({
        title: "Error",
        description: "Invalid passkey",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .in('id', selectedTasks);

      if (error) throw error;
      
      await loadTasks();
      clearSelection();
      setBulkAction(null);
      setBulkDeletePasskey('');
      toast({
        title: "Success",
        description: `${selectedTasks.length} tasks deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting tasks:', error);
      toast({
        title: "Error",
        description: "Failed to delete tasks",
        variant: "destructive",
      });
    }
  };

  const confirmBulkFinish = async () => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ 
          status: 'finished', 
          remarks: bulkRemarks || null,
          finished_at: new Date().toISOString()
        })
        .in('id', selectedTasks);

      if (error) throw error;
      
      await loadTasks();
      clearSelection();
      setBulkAction(null);
      setBulkRemarks('');
      toast({
        title: "Success",
        description: `${selectedTasks.length} tasks marked as finished`,
      });
    } catch (error) {
      console.error('Error finishing tasks:', error);
      toast({
        title: "Error",
        description: "Failed to finish tasks",
        variant: "destructive",
      });
    }
  };

  const confirmBulkEdit = async () => {
    if (!bulkRemarks.trim()) {
      toast({
        title: "Error",
        description: "Please enter remarks for bulk edit",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('todos')
        .update({ remarks: bulkRemarks })
        .in('id', selectedTasks);

      if (error) throw error;
      
      await loadTasks();
      clearSelection();
      setBulkAction(null);
      setBulkRemarks('');
      toast({
        title: "Success",
        description: `${selectedTasks.length} tasks updated successfully`,
      });
    } catch (error) {
      console.error('Error updating tasks:', error);
      toast({
        title: "Error",
        description: "Failed to update tasks",
        variant: "destructive",
      });
    }
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Filter tasks based on search term and assigned to
  const filterTasks = (taskList: Task[]) => {
    let filteredTasks = taskList;

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.text.toLowerCase().includes(searchLower)
      );
    }

    // Filter by assigned to
    if (filterByAssignedTo !== 'all') {
      if (filterByAssignedTo === 'unassigned') {
        filteredTasks = filteredTasks.filter(task => !task.assigned_to);
      } else {
        filteredTasks = filteredTasks.filter(task => task.assigned_to === filterByAssignedTo);
      }
    }

    return filteredTasks;
  };

  const unfinishedTasks = filterTasks(tasks.filter(task => task.status === 'unfinished'));
  const finishedTasks = filterTasks(tasks.filter(task => task.status === 'finished'));

  // Clear selection when changing tabs
  useEffect(() => {
    clearSelection();
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Todo List Management
          </CardTitle>
          <CardDescription>
            Add and manage tasks with completion status and remarks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Type</label>
            <Select value={taskType} onValueChange={(value: 'single' | 'multi') => setTaskType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Task</SelectItem>
                <SelectItem value="multi">Multi Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Single Task Input */}
          {taskType === 'single' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Text</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter single task..."
                  value={singleTaskText}
                  onChange={(e) => setSingleTaskText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSingleTask()}
                />
                <Button onClick={addSingleTask} disabled={!singleTaskText.trim()}>
                  Add Task
                </Button>
              </div>
              
              {/* Assign To Dropdown - Optional */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Assign To (Optional)</label>
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {adminMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.mobile}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Multi Task Input */}
          {taskType === 'multi' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Task Texts (separate with commas)</label>
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter multiple tasks separated by commas (e.g., Task 1, Task 2, Task 3)..."
                  value={multiTaskText}
                  onChange={(e) => setMultiTaskText(e.target.value)}
                  rows={3}
                />
                
                {/* Assign To Dropdown - Optional */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Assign All To (Optional)</label>
                  <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {adminMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} - {member.mobile}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={addMultiTasks} disabled={!multiTaskText.trim()}>
                  Add Tasks
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tasks Management</span>
            <div className="flex gap-2">
              <Button
                variant={showCalendar ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                {showCalendar ? "Hide Calendar" : "Calendar View"}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Manage your tasks and their completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks by text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter by Assigned To */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Filter by Assigned To:</label>
              <Select value={filterByAssignedTo} onValueChange={setFilterByAssignedTo}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="All tasks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tasks</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {adminMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} - {member.mobile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {showCalendar ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
              {selectedDate && (
                <div className="space-y-3">
                  <h3 className="font-medium">
                    Tasks for {format(selectedDate, "PPP")}
                  </h3>
                  {getTasksForDate(selectedDate).length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No tasks for this date.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getTasksForDate(selectedDate).map((task) => (
                        <Card key={task.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <span className={task.status === 'finished' ? 'line-through text-muted-foreground' : 'underline'}>
                                {task.text}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={task.status === 'finished' ? 'default' : 'secondary'}>
                                  {task.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Created: {format(new Date(task.created_at), "HH:mm")}
                                  {task.finished_at && (
                                    <> | Finished: {format(new Date(task.finished_at), "HH:mm")}</>
                                  )}
                                </span>
                              </div>
                              {task.remarks && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Remarks: {task.remarks}
                                </p>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unfinished">
                  Unfinished ({unfinishedTasks.length})
                </TabsTrigger>
                <TabsTrigger value="finished">
                  Finished ({finishedTasks.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="unfinished" className="space-y-3 mt-4">
                {unfinishedTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No unfinished tasks. Great job!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bulk Action Controls */}
                    {selectedTasks.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">
                          {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startBulkAction('finish')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Finish Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startBulkAction('edit')}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => startBulkAction('delete')}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={clearSelection}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={unfinishedTasks.length > 0 && unfinishedTasks.every(task => selectedTasks.includes(task.id))}
                                onCheckedChange={() => toggleSelectAll(unfinishedTasks)}
                              />
                            </TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unfinishedTasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedTasks.includes(task.id)}
                                  onCheckedChange={() => toggleTaskSelection(task.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium underline">{task.text}</div>
                              </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{task.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {task.assigned_member ? (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      <UserCheck className="h-3 w-3 mr-1" />
                                      {task.assigned_member.name}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {task.assigned_member.mobile}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Not assigned</span>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startAssigning(task.id, task.assigned_to || '')}
                                  className="h-6 text-xs"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(task.created_at), "PPP HH:mm")}
                              </div>
                            </TableCell>
                            <TableCell>
                              {editingTask === task.id ? (
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="Add remarks..."
                                    value={editRemarks}
                                    onChange={(e) => setEditRemarks(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => updateTaskRemarks(task.id, editRemarks)}
                                    className="h-8 px-2"
                                  >
                                    <Save className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={cancelEditing}
                                    className="h-8 px-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    {task.remarks || 'No remarks'}
                                  </span>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => startEditingRemarks(task)}
                                    className="h-6 px-1"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleTaskStatus(task.id)}
                                  className="h-8 px-2"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Finish
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => startDeleting(task.id)}
                                  className="h-8 px-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="finished" className="space-y-3 mt-4">
                {finishedTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No finished tasks yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bulk Action Controls for Finished Tasks */}
                    {selectedTasks.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">
                          {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startBulkAction('edit')}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => startBulkAction('delete')}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Selected
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={clearSelection}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={finishedTasks.length > 0 && finishedTasks.every(task => selectedTasks.includes(task.id))}
                                onCheckedChange={() => toggleSelectAll(finishedTasks)}
                              />
                            </TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Created/Finished</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {finishedTasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedTasks.includes(task.id)}
                                  onCheckedChange={() => toggleTaskSelection(task.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium line-through text-muted-foreground">{task.text}</div>
                              </TableCell>
                            <TableCell>
                              <Badge variant="default">{task.status}</Badge>
                            </TableCell>
                            <TableCell>
                              {task.assigned_member ? (
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    {task.assigned_member.name}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {task.assigned_member.mobile}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">Not assigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Created: {format(new Date(task.created_at), "MMM dd, HH:mm")}
                                </div>
                                {task.finished_at && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Finished: {format(new Date(task.finished_at), "MMM dd, HH:mm")}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {task.remarks || 'No remarks'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => toggleTaskStatus(task.id)}
                                  className="h-8 px-2"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Unfinish
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => startDeleting(task.id)}
                                  className="h-8 px-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialogs */}
      <Dialog open={bulkAction === 'delete'} onOpenChange={() => bulkAction === 'delete' && cancelBulkAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Delete Tasks</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTasks.length} selected task{selectedTasks.length > 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Enter passkey to confirm deletion:</label>
              <Input
                type="password"
                placeholder="Enter passkey..."
                value={bulkDeletePasskey}
                onChange={(e) => setBulkDeletePasskey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelBulkAction}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete}>
              Delete Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAction === 'finish'} onOpenChange={() => bulkAction === 'finish' && cancelBulkAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Finish Tasks</DialogTitle>
            <DialogDescription>
              Mark {selectedTasks.length} selected task{selectedTasks.length > 1 ? 's' : ''} as finished.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Remarks (optional):</label>
              <Textarea
                placeholder="Add remarks for all selected tasks..."
                value={bulkRemarks}
                onChange={(e) => setBulkRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelBulkAction}>
              Cancel
            </Button>
            <Button onClick={confirmBulkFinish}>
              Finish Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkAction === 'edit'} onOpenChange={() => bulkAction === 'edit' && cancelBulkAction()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit Tasks</DialogTitle>
            <DialogDescription>
              Update remarks for {selectedTasks.length} selected task{selectedTasks.length > 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New remarks:</label>
              <Textarea
                placeholder="Enter new remarks for all selected tasks..."
                value={bulkRemarks}
                onChange={(e) => setBulkRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelBulkAction}>
              Cancel
            </Button>
            <Button onClick={confirmBulkEdit}>
              Update Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finish Task Dialog */}
      <Dialog open={!!finishingTask} onOpenChange={(open) => !open && cancelFinishing()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Task</DialogTitle>
            <DialogDescription>
              Add remarks for completing this task (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add any remarks or notes about completing this task..."
              value={finishRemarks}
              onChange={(e) => setFinishRemarks(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelFinishing}>
              Cancel
            </Button>
            <Button onClick={confirmFinishTask}>
              Mark as Finished
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Task Dialog */}
      <Dialog open={!!deletingTask} onOpenChange={(open) => !open && cancelDeleting()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please enter the passkey to confirm deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter passkey..."
              value={deletePasskey}
              onChange={(e) => setDeletePasskey(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTask}>
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={!!assigningTask} onOpenChange={(open) => !open && cancelAssigning()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task to Team Member</DialogTitle>
            <DialogDescription>
              Select an admin team member to assign this task to, or leave blank to unassign.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
               <SelectContent className="bg-background border z-50">
                <SelectItem value="unassigned">No assignment</SelectItem>
                {adminMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{member.name}</span>
                      <div className="flex items-center gap-2 ml-2 text-xs text-muted-foreground">
                        <span>{member.mobile}</span>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelAssigning}>
              Cancel
            </Button>
            <Button onClick={confirmAssignTask}>
              {selectedMember && selectedMember !== "unassigned" ? 'Assign Task' : 'Remove Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};