import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TaskManagement } from "@/components/TaskManagement";
import { MobileLogin } from "@/components/MobileLogin";
import { UserProfile } from "@/components/UserProfile";
import { AgentTestimonialProfile } from "@/components/AgentTestimonialProfile";
import { DailyNote } from "@/components/DailyNote";
import { CoordinatorReports } from "@/components/CoordinatorReports";
import { TodoList } from "@/components/admin/TodoList";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, FileText, CheckSquare } from "lucide-react";
import { User } from "@/lib/authService";
import { useToast } from "@/hooks/use-toast";
const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isPanchayathOpen, setIsPanchayathOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const {
    toast
  } = useToast();

  // Load user from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully"
    });
  };

  // Show login screen if user is not authenticated
  if (!currentUser) {
    return <MobileLogin onLogin={handleLogin} />;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Agent Management System</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Welcome, {currentUser.name}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <UserProfile currentUser={currentUser} onUserUpdate={setCurrentUser} />
            
            {/* Show Team Admin Panel button only for team members */}
            {currentUser.hasAdminAccess && <Button variant="outline" onClick={() => window.location.href = '/admin'} className="w-full sm:w-auto border-primary/20 hover:border-primary">
                Team Admin Panel
              </Button>}
            
            {/* Show Reports button only for coordinators */}
            {currentUser.role === 'coordinator' && <Button variant="outline" onClick={() => setIsReportsOpen(!isReportsOpen)} className="w-full sm:w-auto border-blue-500/20 hover:border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </Button>}
            
            {/* Show Todo List button only for coordinators */}
            {currentUser.role === 'coordinator' && <Button variant="outline" onClick={() => setIsTodoOpen(!isTodoOpen)} className="w-full sm:w-auto border-green-500/20 hover:border-green-500 bg-green-50 hover:bg-green-100 text-green-700 flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks
              </Button>}
            
            <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto border-destructive/20 hover:border-destructive bg-destructive/10 hover:bg-destructive/20 text-destructive">
              Logout
            </Button>
          </div>
        </div>

        {/* Daily Note Feature */}
        <div className="mb-6">
          <DailyNote currentUser={currentUser} />
        </div>

        {/* Coordinator Reports */}
        {currentUser.role === 'coordinator' && isReportsOpen && <div className="mb-6">
            <CoordinatorReports currentUser={currentUser} />
          </div>}

        {/* Coordinator Todo List */}
        {currentUser.role === 'coordinator' && isTodoOpen && <div className="mb-6">
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Task Management</h2>
              <TodoList />
            </div>
          </div>}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Collapsible open={isPanchayathOpen} onOpenChange={setIsPanchayathOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="cursor-pointer transition-all duration-300 hover:scale-[1.02]">
                <div className="relative overflow-hidden rounded-lg border-2 transition-all duration-300 border-coordinator shadow-xl bg-coordinator/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-coordinator/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative p-4 sm:p-6 bg-teal-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-coordinator shadow-sm"></div>
                        <h3 className="text-lg sm:text-xl font-semibold">Manage Panchayath</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {isPanchayathOpen ? <ChevronDown className="h-5 w-5 text-gray-700" /> : <ChevronRight className="h-5 w-5 text-gray-700" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-4 sm:mt-6">
                <div className="mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">പഞ്ചായത്തുകളെയോ ഏജന്റുമാരെയോ ചേർക്കാൻ ഇവിടെ ക്ലിക്കുചെയ്യുക</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <TaskManagement currentUser={currentUser} />
                  </div>
                  <div>
                    <AgentTestimonialProfile currentUser={currentUser} />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>;
};
export default Index;