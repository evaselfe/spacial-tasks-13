import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

interface MyTasksProps {
  userId: string;
}

export const MyTasks = ({ userId }: MyTasksProps) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for now - will implement real functionality later
    setTimeout(() => {
      setLoading(false);
      setTasks([]); // Empty for now
    }, 1000);
  }, [userId]);

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
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No tasks assigned to you yet.</p>
          <p className="text-xs text-muted-foreground mt-2">
            Tasks will appear here when administrators assign them to you.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};