import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Plus, Edit, Save, X } from "lucide-react";

interface Task {
  id: string;
  text: string;
  status: 'finished' | 'unfinished';
  remarks: string;
  createdAt: Date;
}

export const TodoList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskType, setTaskType] = useState<'single' | 'multi'>('single');
  const [singleTaskText, setSingleTaskText] = useState('');
  const [multiTaskText, setMultiTaskText] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editRemarks, setEditRemarks] = useState('');

  const addSingleTask = () => {
    if (!singleTaskText.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: singleTaskText,
      status: 'unfinished',
      remarks: '',
      createdAt: new Date()
    };

    setTasks([...tasks, newTask]);
    setSingleTaskText('');
  };

  const addMultiTasks = () => {
    if (!multiTaskText.trim()) return;

    const taskTexts = multiTaskText.split(',').map(text => text.trim()).filter(text => text.length > 0);
    
    const newTasks: Task[] = taskTexts.map(text => ({
      id: `${Date.now()}-${Math.random()}`,
      text,
      status: 'unfinished' as const,
      remarks: '',
      createdAt: new Date()
    }));

    setTasks([...tasks, ...newTasks]);
    setMultiTaskText('');
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'finished' ? 'unfinished' : 'finished' }
        : task
    ));
  };

  const updateTaskRemarks = (taskId: string, remarks: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, remarks } : task
    ));
    setEditingTask(null);
    setEditRemarks('');
  };

  const startEditingRemarks = (task: Task) => {
    setEditingTask(task.id);
    setEditRemarks(task.remarks);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditRemarks('');
  };

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

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({tasks.length})</CardTitle>
          <CardDescription>
            Manage your tasks and their completion status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks added yet. Create your first task above.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className={`${task.status === 'finished' ? 'line-through text-muted-foreground' : 'underline'}`}
                        >
                          {task.text}
                        </span>
                        <Badge variant={task.status === 'finished' ? 'default' : 'secondary'}>
                          {task.status}
                        </Badge>
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

                    {/* Status Toggle */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={task.status === 'finished' ? 'default' : 'outline'}
                        onClick={() => toggleTaskStatus(task.id)}
                        className="flex items-center gap-1"
                      >
                        {task.status === 'finished' ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Finished
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4" />
                            Unfinished
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};