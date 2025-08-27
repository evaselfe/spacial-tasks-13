import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskManagement } from "@/components/TaskManagement";
import { MobileLogin } from "@/components/MobileLogin";
import { UserProfile } from "@/components/UserProfile";
import { User } from "@/lib/authService";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Panchayath Management System
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Welcome, {currentUser.name}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <UserProfile currentUser={currentUser} onUserUpdate={setCurrentUser} />
            
            {/* Show Team Admin Panel button only for team members */}
            {currentUser.hasAdminAccess && (
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/admin'}
                className="w-full sm:w-auto border-primary/20 hover:border-primary"
              >
                Team Admin Panel
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="w-full sm:w-auto border-destructive/20 hover:border-destructive bg-destructive/10 hover:bg-destructive/20 text-destructive"
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="cursor-pointer transition-all duration-300 hover:scale-[1.02] scale-[1.02]">
            <div className="relative overflow-hidden rounded-lg border-2 transition-all duration-300 border-coordinator shadow-xl bg-coordinator/10">
              <div className="absolute inset-0 bg-gradient-to-br from-coordinator/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-4 sm:p-6 bg-teal-200">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-coordinator shadow-sm"></div>
                  <h3 className="text-lg sm:text-xl font-semibold">Manage Panchayath</h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-950 leading-relaxed">പഞ്ചായത്തുകളെയോ ഏജന്റുമാരെയോ ചേർക്കാൻ ഇവിടെ ക്ലിക്കുചെയ്യുക</p>
              </div>
            </div>
          </div>
        </div>

        <TaskManagement currentUser={currentUser} />
      </div>
    </div>;
};
export default Index;