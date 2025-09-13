import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MyTasksProps {
  userId: string;
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

export const MyTasks = ({ userId }: MyTasksProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('todos')
          .select('id, text, status, remarks, created_at, finished_at')
          .filter('assigned_to', 'eq', userId)
          .order('created_at', { ascending: false });

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
  }, [userId]);

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card mb-2">
      <div className="flex items-start gap-3">
        {task.status === 'finished' ? (
          <CheckCircle className="h-5 w-5 text-primary" />
        ) : (
          <Clock className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="font-medium text-foreground">{task.text}</p>
          {task.remarks && <p className="text-sm text-muted-foreground mt-1">{task.remarks}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(task.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <Badge variant={task.status === 'finished' ? 'secondary' : 'outline'}>
        {task.status === 'finished' ? 'Finished' : 'Pending'}
      </Badge>
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

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Your Assigned Tasks ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tasks assigned to you yet.</p>
            <p className="text-xs text-muted-foreground mt-2">
              Tasks will appear here when administrators assign them to you.
            </p>
          </div>
        ) : (
          <div>
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};