import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PanchayathView } from "@/components/PanchayathView";
import { PanchayathHierarchy } from "@/components/PanchayathHierarchy";
import { HistoryTab } from "@/components/HistoryTab";
import { AgentTestimonialAnalytics } from "@/components/admin/AgentTestimonialAnalytics";
import { BarChart3, Network, History, MessageSquare } from "lucide-react";

export const ViewAnalyze = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          View & Analyze
        </CardTitle>
        <CardDescription>
          View panchayath analytics, hierarchy, and history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 sm:py-2.5 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="hierarchy" className="text-xs sm:text-sm py-2 sm:py-2.5 flex items-center gap-2">
              <Network className="h-4 w-4" />
              Hierarchy
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="text-xs sm:text-sm py-2 sm:py-2.5 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Testimonials
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm py-2 sm:py-2.5 flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics">
            <PanchayathView />
          </TabsContent>
          
          <TabsContent value="hierarchy">
            <PanchayathHierarchy />
          </TabsContent>
          
          <TabsContent value="testimonials">
            <AgentTestimonialAnalytics />
          </TabsContent>
          
          <TabsContent value="history">
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};