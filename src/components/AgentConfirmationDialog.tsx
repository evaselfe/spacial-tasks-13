import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Building2, User } from "lucide-react";

interface AgentDetails {
  name: string;
  mobile: string;
  ward?: number;
  panchayath: string;
  role: string;
  groupLeader?: string;
}

interface AgentConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  agentDetails: Partial<AgentDetails>;
}

export const AgentConfirmationDialog = ({ isOpen, onConfirm, agentDetails }: AgentConfirmationDialogProps) => {
  const getRoleColor = (role: string) => {
    if (!role) return "bg-muted";
    
    switch (role.toLowerCase()) {
      case "coordinator": return "bg-coordinator text-white";
      case "supervisor": return "bg-supervisor text-white";
      case "group leader": return "bg-group-leader text-white";
      case "pro": return "bg-pro text-white";
      default: return "bg-muted";
    }
  };

  // Provide default values to prevent undefined errors
  const safeAgentDetails = {
    name: agentDetails?.name || "N/A",
    mobile: agentDetails?.mobile || "N/A",
    ward: agentDetails?.ward,
    panchayath: agentDetails?.panchayath || "N/A",
    role: agentDetails?.role || "Agent",
    groupLeader: agentDetails?.groupLeader
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
            Agent Added Successfully
          </AlertDialogTitle>
          <AlertDialogDescription>
            Please confirm the agent details below:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Agent Details</span>
            <Badge className={getRoleColor(safeAgentDetails.role)}>
              {safeAgentDetails.role}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm text-muted-foreground">Name:</span>
                <p className="font-medium">{safeAgentDetails.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm text-muted-foreground">Mobile:</span>
                <p className="font-medium">{safeAgentDetails.mobile}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-sm text-muted-foreground">Panchayath:</span>
                <p className="font-medium">{safeAgentDetails.panchayath}</p>
              </div>
            </div>
            
            {safeAgentDetails.ward && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Ward:</span>
                  <p className="font-medium">Ward {safeAgentDetails.ward}</p>
                </div>
              </div>
            )}
            
            {safeAgentDetails.groupLeader && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Group Leader:</span>
                  <p className="font-medium">{safeAgentDetails.groupLeader}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogAction onClick={onConfirm} className="w-full">
            OK, Confirmed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};