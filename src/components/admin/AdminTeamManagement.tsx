import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, UserPlus, Trash2, Edit, Shield } from "lucide-react";
import { AdminTeamForm } from "./AdminTeamForm";
import { AdminMemberForm } from "./AdminMemberForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminTeam {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  member_count?: number;
}

interface AdminMember {
  id: string;
  team_id: string;
  name: string;
  mobile: string;
  panchayath: string;
  role: string;
  created_at: string;
}

export const AdminTeamManagement = () => {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<AdminTeam | null>(null);
  const [teamMembers, setTeamMembers] = useState<AdminMember[]>([]);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<AdminTeam | null>(null);
  const [editingMember, setEditingMember] = useState<AdminMember | null>(null);
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
        .from('admin_teams')
        .select('*');

      if (error) throw error;

      // Fetch member counts for each team
      const teamsWithCounts = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { count } = await supabase
            .from('admin_members')
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
      console.error("Error fetching admin teams:", error);
      toast({
        title: "Error",
        description: "Failed to fetch admin teams",
        variant: "destructive",
      });
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data: membersData, error } = await supabase
        .from('admin_members')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTeamMembers(membersData || []);
    } catch (error) {
      console.error("Error fetching admin team members:", error);
      toast({
        title: "Error",
        description: "Failed to fetch admin team members",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this admin team? This will also remove all members.")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      
      // Update local state
      setTeams(teams.filter(team => team.id !== teamId));
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setTeamMembers([]);
      }
      
      toast({
        title: "Success",
        description: "Admin team deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting admin team:", error);
      toast({
        title: "Error",
        description: "Failed to delete admin team",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this admin member?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Update local state
      setTeamMembers(teamMembers.filter(member => member.id !== memberId));
      
      toast({
        title: "Success",
        description: "Admin member removed successfully",
      });
    } catch (error) {
      console.error("Error removing admin member:", error);
      toast({
        title: "Error",
        description: "Failed to remove admin member",
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Administration Team Management
          </h2>
          <p className="text-muted-foreground">Manage admin teams and their members</p>
        </div>
        <Button 
          onClick={() => {
            setEditingTeam(null);
            setShowTeamForm(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Admin Team
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Teams ({teams.length})
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
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No admin teams created yet</p>
                <p className="text-sm">Click "Add Admin Team" to get started</p>
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
                  Admin Members
                  {selectedTeam && (
                    <Badge variant="outline" className="ml-2">
                      {selectedTeam.name}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedTeam 
                    ? "Manage members in the selected admin team"
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
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {member.panchayath}
                          </Badge>
                        </div>
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
                    <p>No members in this admin team</p>
                    <p className="text-sm">Click "Add Member" to get started</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select an admin team to view its members</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Forms */}
      {showTeamForm && (
        <AdminTeamForm
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
        <AdminMemberForm
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