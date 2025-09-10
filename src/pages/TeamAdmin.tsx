import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewAnalyze } from "@/components/admin/ViewAnalyze";
import { PanchayathManagement } from "@/components/admin/PanchayathManagement";
import { AgentTestimonialAnalytics } from "@/components/admin/AgentTestimonialAnalytics";
import { PerformanceReport } from "@/components/admin/PerformanceReport";
import { TodoList } from "@/components/admin/TodoList";
import { ArrowLeft, Shield, Settings, BarChart3, MapPin, Users, MessageSquare, TrendingDown, ListTodo } from "lucide-react";
import { useNavigate } from "react-router-dom";
const TeamAdmin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("panchayath");
  return <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                 Team Admin Panel
               </h1>
               <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                 Manage teams and administrative settings
              </p>
            </div>
          </div>
        </div>

        {/* Admin Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "panchayath" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("panchayath")}>
            <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "panchayath" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-3 bg-green-50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Panchayath (പഞ്ചായത്ത് ചേർക്കാൻ)</CardTitle>
                </div>
                <CardDescription>
                  Create and manage panchayaths
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "analytics" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("analytics")}>
            <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "analytics" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-3 bg-red-50">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Hierarchy View (ശ്രേണി കാണാൻ)</CardTitle>
                </div>
                <CardDescription>
                  View panchayath analytics and hierarchy
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "testimonials" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("testimonials")}>
            <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "testimonials" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-3 bg-blue-50">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Testimonials (അനുമാന ചോദ്യങ്ങളും ഉത്തരങ്ങളും)</CardTitle>
                </div>
                <CardDescription>
                  View agent testimonials and feedback
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "performance" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("performance")}>
            <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "performance" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-3 bg-purple-50">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Performance (ഏജൻ്റുമാരുടെ പ്രകടന റിപ്പോർട്ടുകൾ)</CardTitle>
                </div>
                <CardDescription>
                  View panchayath performance reports
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${activeTab === "todo" ? "scale-[1.02]" : ""}`} onClick={() => setActiveTab("todo")}>
            <Card className={`relative overflow-hidden border-2 transition-all duration-300 ${activeTab === "todo" ? "border-primary shadow-xl bg-primary/10" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              <CardHeader className="pb-3 bg-orange-50">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Todo List (ചെയ്യേണ്ട കാര്യങ്ങൾ)</CardTitle>
                </div>
                <CardDescription>
                  Manage tasks and to-do items
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="panchayath">
            <PanchayathManagement />
          </TabsContent>
          
          <TabsContent value="analytics">
            <ViewAnalyze />
          </TabsContent>

          <TabsContent value="testimonials">
            <AgentTestimonialAnalytics />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceReport />
          </TabsContent>

          <TabsContent value="todo">
            <TodoList />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default TeamAdmin;