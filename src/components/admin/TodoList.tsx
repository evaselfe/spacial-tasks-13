import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle, XCircle, Plus, Edit, Save, X, Calendar as CalendarIcon, Clock, Trash2, Search } from "lucide-react";
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
  const { toast } = useToast();

  // Load tasks from database
  useEffect(() => {
    loadTasks();
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
      
      // Type the data properly from database
      const typedTasks: Task[] = (data || []).map(task => ({
        id: task.id,
        text: task.text,
        status: task.status as 'finished' | 'unfinished',
        remarks: task.remarks,
        created_at: task.created_at,
        finished_at: task.finished_at
      }));
      
      console.log('Typed tasks:', typedTasks);
      setTasks(typedTasks);
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

  const addSingleTask = async () => {
    if (!singleTaskText.trim()) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('todos')
        .insert([{
          text: singleTaskText,
          status: 'unfinished',
          remarks: null,
          created_by: user?.id || null  // Handle null case properly
        }]);

      if (error) throw error;
      
      setSingleTaskText('');
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
      const newTasks = taskTexts.map(text => ({
        text,
        status: 'unfinished' as const,
        remarks: null,
        created_by: user?.id || null  // Handle null case properly
      }));

      const { error } = await supabase
        .from('todos')
        .insert(newTasks);

      if (error) throw error;
      
      setMultiTaskText('');
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

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.created_at);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Filter tasks based on search term
  const filterTasksBySearch = (taskList: Task[]) => {
    if (!searchTerm.trim()) return taskList;
    
    const searchLower = searchTerm.toLowerCase();
    return taskList.filter(task => 
      task.text.toLowerCase().includes(searchLower) ||
      task.id.toLowerCase().includes(searchLower) ||
      (task.remarks && task.remarks.toLowerCase().includes(searchLower))
    );
  };

  const unfinishedTasks = filterTasksBySearch(tasks.filter(task => task.status === 'unfinished'));
  const finishedTasks = filterTasksBySearch(tasks.filter(task => task.status === 'finished'));

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
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search tasks by text, ID, or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                  <div className="space-y-3">
                    {unfinishedTasks.map((task) => (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="underline">{task.text}</span>
                              <Badge variant="secondary">{task.status}</Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Created: {format(new Date(task.created_at), "PPP HH:mm")}
                            </div>
                            
                            {/* Remarks Section */}
                            <div className="space-y-2">
                              {editingTask === task.id ? (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add remarks..."
                                    value={editRemarks}
                                    onChange={(e) => setEditRemarks(e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => updateTaskRemarks(task.id, editRemarks)}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={cancelEditing}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">
                                    Remarks: {task.remarks || 'No remarks'}
                                  </span>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => startEditingRemarks(task)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleTaskStatus(task.id)}
                              className="flex items-center gap-1"
                            >
                              <XCircle className="h-4 w-4" />
                              Mark Finished
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => startDeleting(task.id)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="finished" className="space-y-3 mt-4">
                {finishedTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No finished tasks yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {finishedTasks.map((task) => (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="line-through text-muted-foreground">{task.text}</span>
                              <Badge variant="default">{task.status}</Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Created: {format(new Date(task.created_at), "PPP HH:mm")}
                              </div>
                              {task.finished_at && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Finished: {format(new Date(task.finished_at), "PPP HH:mm")}
                                </div>
                              )}
                            </div>
                            
                            {task.remarks && (
                              <div className="text-sm text-muted-foreground">
                                <strong>Remarks:</strong> {task.remarks}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => toggleTaskStatus(task.id)}
                              className="flex items-center gap-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Mark Unfinished
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => startDeleting(task.id)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};