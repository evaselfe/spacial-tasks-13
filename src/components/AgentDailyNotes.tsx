import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, User, Phone } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AgentDailyNotesProps {
  agentName: string;
  agentType: string;
  agentMobile: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DailyNote {
  id: string;
  date: string;
  activity: string | null;
  is_leave: boolean;
  created_at: string;
  updated_at: string;
}

export const AgentDailyNotes = ({ 
  agentName, 
  agentType, 
  agentMobile, 
  open, 
  onOpenChange 
}: AgentDailyNotesProps) => {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && agentMobile) {
      fetchAgentNotes();
    }
  }, [open, agentMobile]);

  const fetchAgentNotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('mobile_number', agentMobile)
        .order('date', { ascending: false })
        .limit(30); // Show last 30 days

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching agent notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch daily notes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityStats = () => {
    const totalDays = notes.length;
    const activeDays = notes.filter(note => !note.is_leave && note.activity).length;
    const leaveDays = notes.filter(note => note.is_leave || !note.activity).length;
    
    return { totalDays, activeDays, leaveDays };
  };

  const stats = getActivityStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daily Notes History
          </DialogTitle>
          <DialogDescription>
            View and manage daily notes for this agent
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Agent Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{agentName}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {agentType}
                      </Badge>
                      <Phone className="h-3 w-3" />
                      <span>{agentMobile}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Activity Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalDays}</div>
                  <div className="text-sm text-muted-foreground">Total Days</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.activeDays}</div>
                  <div className="text-sm text-muted-foreground">Active Days</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.leaveDays}</div>
                  <div className="text-sm text-muted-foreground">Leave Days</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity (Last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading daily notes...
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No daily notes found for this agent
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg border ${
                        note.is_leave || !note.activity
                          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                          : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(note.date), 'EEEE, MMMM do, yyyy')}
                          </span>
                          <Badge 
                            variant={note.is_leave || !note.activity ? "destructive" : "default"}
                            className="text-xs"
                          >
                            {note.is_leave || !note.activity ? "Leave" : "Active"}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(note.updated_at), 'HH:mm')}
                        </span>
                      </div>
                      {note.activity && (
                        <div className="text-sm">
                          <span className="font-medium">Activity: </span>
                          <span>{note.activity}</span>
                        </div>
                      )}
                      {(note.is_leave || !note.activity) && (
                        <div className="text-sm text-muted-foreground italic">
                          No activity recorded (marked as leave)
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};