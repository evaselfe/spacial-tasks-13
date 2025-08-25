import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, UserPlus, Trash2, Edit } from "lucide-react";
import { TeamForm } from "./TeamForm";
import { TeamMemberForm } from "./TeamMemberForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  member_count?: number;
}

interface TeamMember {
  id: string;
  team_id: string;
  name: string;
  mobile: string;
  role: string;
  joined_at: string;
}

export const TeamManagement = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch teams on component mount
  useEffect(() => {
    fetchTeams();
  }, []);

  // Fetch team members when a team is selected
  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts for each team
      const teamsWithCounts = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);
          
          return {
            ...team,
            member_count: count || 0
          };
        })
      );

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast({
        title: "Error",
        description: "Failed to fetch teams",
        variant: "destructive",
      });
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      // Map to match the interface (using email as mobile since schema has email)
      const mappedMembers: TeamMember[] = (data || []).map(member => ({
        id: member.id,
        team_id: member.team_id!,
        name: member.name,
        mobile: member.email, // Using email field as mobile
        role: member.role,
        joined_at: member.joined_at || new Date().toISOString()
      }));

      setTeamMembers(mappedMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    
    setLoading(true);
    try {
      // First delete all team members
      const { error: membersError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      // Then delete the team
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (teamError) throw teamError;

      // Update local state
      setTeams(teams.filter(team => team.id !== teamId));
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setTeamMembers([]);
      }
      
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting team:", error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Update local state
      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
      
      toast({
        title: "Success",
        description: "Team member removed successfully",
      });
    } catch (error) {
      console.error("Error removing team member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground">Manage teams and their members</p>
        </div>
        <Button 
          onClick={() => {
            setEditingTeam(null);
            setShowTeamForm(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Team
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teams ({teams.length})
            </CardTitle>
            <CardDescription>
              Select a team to manage its members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedTeam?.id === team.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {team.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {team.member_count || 0} members
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTeam(team);
                        setShowTeamForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(team.id);
                      }}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {teams.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No teams created yet</p>
                <p className="text-sm">Click "Add Team" to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Team Members
                  {selectedTeam && (
                    <Badge variant="outline" className="ml-2">
                      {selectedTeam.name}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedTeam 
                    ? "Manage members in the selected team"
                    : "Select a team to view its members"
                  }
                </CardDescription>
              </div>
              {selectedTeam && (
                <Button
                  onClick={() => {
                    setEditingMember(null);
                    setShowMemberForm(true);
                  }}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedTeam ? (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.mobile}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {member.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingMember(member);
                            setShowMemberForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {teamMembers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No members in this team</p>
                    <p className="text-sm">Click "Add Member" to get started</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a team to view its members</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forms */}
      {showTeamForm && (
        <TeamForm
          team={editingTeam}
          onSuccess={() => {
            setShowTeamForm(false);
            setEditingTeam(null);
            fetchTeams();
          }}
          onCancel={() => {
            setShowTeamForm(false);
            setEditingTeam(null);
          }}
        />
      )}

      {showMemberForm && selectedTeam && (
        <TeamMemberForm
          teamId={selectedTeam.id}
          member={editingMember}
          onSuccess={() => {
            setShowMemberForm(false);
            setEditingMember(null);
            fetchTeamMembers(selectedTeam.id);
          }}
          onCancel={() => {
            setShowMemberForm(false);
            setEditingMember(null);
          }}
        />
      )}
    </div>
  );
};