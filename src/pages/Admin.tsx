import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamManagement } from "@/components/admin/TeamManagement";
import { ArrowLeft, Users, Shield, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("teams");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Manage teams and system settings
              </p>
            </div>
          </div>
        </div>

        {/* Admin Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div 
            className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              activeTab === "teams" ? "scale-[1.02]" : ""
            }`} 
            onClick={() => setActiveTab("teams")}
          >
            <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${
              activeTab === "teams" 
                ? "border-primary shadow-xl bg-primary/10" 
                : "border-border hover:border-primary/50 hover:shadow-lg"
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Team Management</CardTitle>
                </div>
                <CardDescription>
                  Create and manage teams and team members
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div 
            className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              activeTab === "permissions" ? "scale-[1.02]" : ""
            }`} 
            onClick={() => setActiveTab("permissions")}
          >
            <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${
              activeTab === "permissions" 
                ? "border-primary shadow-xl bg-primary/10" 
                : "border-border hover:border-primary/50 hover:shadow-lg"
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Permissions</CardTitle>
                </div>
                <CardDescription>
                  Manage user roles and permissions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div 
            className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              activeTab === "settings" ? "scale-[1.02]" : ""
            }`} 
            onClick={() => setActiveTab("settings")}
          >
            <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${
              activeTab === "settings" 
                ? "border-primary shadow-xl bg-primary/10" 
                : "border-border hover:border-primary/50 hover:shadow-lg"
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">System Settings</CardTitle>
                </div>
                <CardDescription>
                  Configure system-wide settings
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="teams">
            <TeamManagement />
          </TabsContent>
          
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>User Permissions</CardTitle>
                <CardDescription>
                  Manage user roles and access controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Permissions management coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  System settings coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;