import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Activity, AlertTriangle, Users, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Panchayath {
  id: string;
  name: string;
}

interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  mobile_number: string;
  consecutive_leave_days: number;
  is_inactive: boolean;
  last_activity_date: string | null;
  total_notes: number;
}

interface PerformanceStats {
  total_agents: number;
  inactive_agents: number;
  inactive_percentage: number;
}

export const PerformanceReport = () => {
  const [panchayaths, setPanchayaths] = useState<Panchayath[]>([]);
  const [selectedPanchayath, setSelectedPanchayath] = useState<string>("");
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats>({
    total_agents: 0,
    inactive_agents: 0,
    inactive_percentage: 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch panchayaths on component mount
  useEffect(() => {
    fetchPanchayaths();
  }, []);

  // Fetch performance data when panchayath is selected
  useEffect(() => {
    if (selectedPanchayath) {
      fetchPerformanceData();
    }
  }, [selectedPanchayath]);

  const fetchPanchayaths = async () => {
    try {
      const { data, error } = await supabase
        .from('panchayaths')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setPanchayaths(data || []);
    } catch (error) {
      console.error('Error fetching panchayaths:', error);
      toast({
        title: "Error",
        description: "Failed to fetch panchayaths",
        variant: "destructive"
      });
    }
  };

  const fetchPerformanceData = async () => {
    if (!selectedPanchayath) return;
    
    setLoading(true);
    try {
      const allAgents: AgentPerformance[] = [];

      // Get coordinators
      const { data: coordinators, error: coordError } = await supabase
        .from('coordinators')
        .select('id, name, mobile_number, panchayath_id')
        .eq('panchayath_id', selectedPanchayath);

      if (coordError) throw coordError;

      if (coordinators) {
        for (const agent of coordinators) {
          const performance = await analyzeAgentPerformance(agent.mobile_number, agent.name, 'coordinator');
          allAgents.push({
            agent_id: agent.id,
            agent_name: agent.name,
            agent_type: 'coordinator',
            mobile_number: agent.mobile_number,
            ...performance
          });
        }
      }

      // Get supervisors
      const { data: supervisors, error: supError } = await supabase
        .from('supervisors')
        .select('id, name, mobile_number, panchayath_id')
        .eq('panchayath_id', selectedPanchayath);

      if (supError) throw supError;

      if (supervisors) {
        for (const agent of supervisors) {
          const performance = await analyzeAgentPerformance(agent.mobile_number, agent.name, 'supervisor');
          allAgents.push({
            agent_id: agent.id,
            agent_name: agent.name,
            agent_type: 'supervisor',
            mobile_number: agent.mobile_number,
            ...performance
          });
        }
      }

      // Get group leaders
      const { data: groupLeaders, error: glError } = await supabase
        .from('group_leaders')
        .select('id, name, mobile_number, panchayath_id')
        .eq('panchayath_id', selectedPanchayath);

      if (glError) throw glError;

      if (groupLeaders) {
        for (const agent of groupLeaders) {
          const performance = await analyzeAgentPerformance(agent.mobile_number, agent.name, 'group_leader');
          allAgents.push({
            agent_id: agent.id,
            agent_name: agent.name,
            agent_type: 'group_leader',
            mobile_number: agent.mobile_number,
            ...performance
          });
        }
      }

      // Get pros
      const { data: pros, error: prosError } = await supabase
        .from('pros')
        .select('id, name, mobile_number, panchayath_id')
        .eq('panchayath_id', selectedPanchayath);

      if (prosError) throw prosError;

      if (pros) {
        for (const agent of pros) {
          const performance = await analyzeAgentPerformance(agent.mobile_number, agent.name, 'pro');
          allAgents.push({
            agent_id: agent.id,
            agent_name: agent.name,
            agent_type: 'pro',
            mobile_number: agent.mobile_number,
            ...performance
          });
        }
      }

      setAgentPerformance(allAgents);
      
      // Calculate performance statistics
      const totalAgents = allAgents.length;
      const inactiveAgents = allAgents.filter(agent => agent.is_inactive).length;
      const inactivePercentage = totalAgents > 0 ? (inactiveAgents / totalAgents) * 100 : 0;

      setPerformanceStats({
        total_agents: totalAgents,
        inactive_agents: inactiveAgents,
        inactive_percentage: Math.round(inactivePercentage * 100) / 100
      });

    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch performance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeAgentPerformance = async (mobileNumber: string, agentName: string, agentType: string) => {
    try {
      // Get last 30 days of daily notes for this agent
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: notes, error } = await supabase
        .from('daily_notes')
        .select('date, is_leave')
        .eq('mobile_number', mobileNumber)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      let consecutiveLeaveDays = 0;
      let maxConsecutiveLeaveDays = 0;
      let currentStreak = 0;
      
      // Sort notes by date descending to check recent activity
      const sortedNotes = (notes || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Count consecutive leave days from most recent
      for (const note of sortedNotes) {
        if (note.is_leave) {
          currentStreak++;
          maxConsecutiveLeaveDays = Math.max(maxConsecutiveLeaveDays, currentStreak);
        } else {
          if (currentStreak > 0) {
            break; // Stop counting when we hit a non-leave day
          }
        }
      }

      consecutiveLeaveDays = currentStreak;
      const isInactive = consecutiveLeaveDays >= 3;
      const lastActivityDate = sortedNotes.find(note => !note.is_leave)?.date || null;

      return {
        consecutive_leave_days: consecutiveLeaveDays,
        is_inactive: isInactive,
        last_activity_date: lastActivityDate,
        total_notes: notes?.length || 0
      };

    } catch (error) {
      console.error(`Error analyzing performance for ${agentName}:`, error);
      return {
        consecutive_leave_days: 0,
        is_inactive: false,
        last_activity_date: null,
        total_notes: 0
      };
    }
  };

  const getStatusBadge = (agent: AgentPerformance) => {
    if (agent.is_inactive) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Inactive
      </Badge>;
    }
    return <Badge variant="default" className="flex items-center gap-1">
      <Activity className="h-3 w-3" />
      Active
    </Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Panchayath Performance Report
        </CardTitle>
        <CardDescription>
          Monitor agent activity and identify inactive agents based on daily notes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Panchayath Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Panchayath</label>
          <Select value={selectedPanchayath} onValueChange={setSelectedPanchayath}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Choose a panchayath to view performance" />
            </SelectTrigger>
            <SelectContent>
              {panchayaths.map((panchayath) => (
                <SelectItem key={panchayath.id} value={panchayath.id}>
                  {panchayath.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Performance Statistics */}
        {selectedPanchayath && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceStats.total_agents}</div>
                <p className="text-xs text-muted-foreground">All agent types</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-sm font-medium">Inactive Agents</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{performanceStats.inactive_agents}</div>
                <p className="text-xs text-muted-foreground">3+ consecutive leave days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <CardTitle className="text-sm font-medium">Inactive Percentage</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{performanceStats.inactive_percentage}%</div>
                <p className="text-xs text-muted-foreground">Performance metric</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agent Performance Table */}
        {selectedPanchayath && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Agent Performance Details</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading performance data...</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Consecutive Leave Days</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Total Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentPerformance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No agents found for this panchayath
                        </TableCell>
                      </TableRow>
                    ) : (
                      agentPerformance.map((agent) => (
                        <TableRow key={agent.agent_id}>
                          <TableCell className="font-medium">{agent.agent_name}</TableCell>
                          <TableCell className="capitalize">{agent.agent_type}</TableCell>
                          <TableCell>{agent.mobile_number}</TableCell>
                          <TableCell>{getStatusBadge(agent)}</TableCell>
                          <TableCell>
                            <span className={agent.consecutive_leave_days >= 3 ? "text-destructive font-semibold" : ""}>
                              {agent.consecutive_leave_days}
                            </span>
                          </TableCell>
                          <TableCell>
                            {agent.last_activity_date 
                              ? new Date(agent.last_activity_date).toLocaleDateString()
                              : "No activity"
                            }
                          </TableCell>
                          <TableCell>{agent.total_notes}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};