import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, FileText, History, Save, Phone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
interface DailyNoteData {
  id?: string;
  date: string;
  activity: string | null;
  is_leave: boolean;
  mobile_number?: string;
}
interface AgentInfo {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  panchayath_id: string;
}
export const DailyNote = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activity, setActivity] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [notes, setNotes] = useState<DailyNoteData[]>([]);
  const [currentNote, setCurrentNote] = useState<DailyNoteData | null>(null);
  const [activeTab, setActiveTab] = useState("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = selectedDateStr === todayStr;
  useEffect(() => {
    if (isLoggedIn && mobileNumber) {
      fetchNotes();
    }
  }, [isLoggedIn, mobileNumber]);
  useEffect(() => {
    if (selectedDate && notes.length > 0) {
      const note = notes.find(n => n.date === selectedDateStr);
      setCurrentNote(note || null);
      setActivity(note?.activity || "");
    }
  }, [selectedDate, notes, selectedDateStr]);
  const verifyAgent = async () => {
    if (!mobileNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter your mobile number",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.rpc('get_agent_by_mobile', {
        mobile_num: mobileNumber
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setAgentInfo(data[0]);
        setIsLoggedIn(true);
        setActiveTab("today");
        toast({
          title: "Success",
          description: `Welcome ${data[0].agent_name} (${data[0].agent_type})`
        });
      } else {
        toast({
          title: "Agent Not Found",
          description: "No agent found with this mobile number",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying agent:', error);
      toast({
        title: "Error",
        description: "Failed to verify agent",
        variant: "destructive"
      });
    }
  };
  const fetchNotes = async () => {
    if (!mobileNumber) return;
    try {
      const {
        data,
        error
      } = await supabase.from('daily_notes').select('*').eq('mobile_number', mobileNumber).order('date', {
        ascending: false
      });
      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch daily notes",
        variant: "destructive"
      });
    }
  };
  const saveNote = async () => {
    if (!isToday) {
      toast({
        title: "Cannot Edit Past Dates",
        description: "You can only edit today's activity",
        variant: "destructive"
      });
      return;
    }
    if (!mobileNumber || !agentInfo) {
      toast({
        title: "Not Logged In",
        description: "Please log in with your mobile number first",
        variant: "destructive"
      });
      return;
    }
    try {
      const noteData = {
        mobile_number: mobileNumber,
        date: selectedDateStr,
        activity: activity.trim() || null,
        is_leave: !activity.trim()
      };
      if (currentNote) {
        const {
          error
        } = await supabase.from('daily_notes').update(noteData).eq('id', currentNote.id);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from('daily_notes').insert([noteData]);
        if (error) throw error;
      }
      await fetchNotes();
      toast({
        title: "Success",
        description: "Daily note saved successfully"
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save daily note",
        variant: "destructive"
      });
    }
  };
  const logout = () => {
    setIsLoggedIn(false);
    setAgentInfo(null);
    setMobileNumber("");
    setNotes([]);
    setActivity("");
    setActiveTab("login");
  };
  const hasActivity = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const note = notes.find(n => n.date === dateStr);
    return !!(note && !note.is_leave && note.activity);
  };
  const isOnLeave = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const note = notes.find(n => n.date === dateStr);
    return !!(note && (note.is_leave || !note.activity));
  };
  return <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/20 shadow-xl animate-fade-in">
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center justify-between text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Daily Notes
          </div>
          {isLoggedIn && agentInfo && <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{agentInfo.agent_name}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="relative z-10 p-6">
        {!isLoggedIn ? <div className="space-y-4">
            <div className="text-center mb-6">
              <Phone className="h-12 w-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2">Agent Login</h3>
              <p className="text-muted-foreground">ദിവസേനയുള്ള കുറിപ്പുകൾ ചേർക്കാൻ നിങ്ങളുടെ മൊബൈൽ നമ്പർ നൽകുക.</p>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input id="mobile" type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="Enter your mobile number" className="border-white/10 backdrop-blur-sm bg-zinc-50" />
              <Button onClick={verifyAgent} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                <Phone className="h-4 w-4 mr-2" />
                Verify & Login
              </Button>
            </div>
          </div> : <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
              <TabsTrigger value="today" className="data-[state=active]:bg-white/20">
                Today
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-white/20">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className="mt-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground/90">
                    {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                  </h3>
                  {currentNote && !currentNote.is_leave && currentNote.activity && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                  {currentNote && (currentNote.is_leave || !currentNote.activity) && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                </div>
                
                <Textarea value={activity} onChange={e => setActivity(e.target.value)} placeholder={isToday ? "What did you accomplish today?" : "View only - cannot edit past dates"} className="min-h-[120px] bg-white/5 border-white/10 backdrop-blur-sm resize-none" disabled={!isToday} />
                
                {isToday && <Button onClick={saveNote} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 hover-scale">
                    <Save className="h-4 w-4 mr-2" />
                    Save Activity
                  </Button>}
                
                {!isToday && <p className="text-sm text-muted-foreground text-center py-2">
                    You can only edit today's activity
                  </p>}
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Select a date to view activities
                  </p>
                  <div className="flex justify-center gap-4 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Leave</span>
                    </div>
                  </div>
                </div>
                
                <Calendar mode="single" selected={selectedDate} onSelect={date => {
              if (date) {
                setSelectedDate(date);
                setActiveTab("today");
              }
            }} className="rounded-md border-0 bg-white/5 backdrop-blur-sm pointer-events-auto mx-auto" modifiers={{
              hasActivity: hasActivity,
              onLeave: isOnLeave
            }} modifiersClassNames={{
              hasActivity: "bg-green-500/20 text-green-800 hover:bg-green-500/30 border-green-500/50",
              onLeave: "bg-red-500/20 text-red-800 hover:bg-red-500/30 border-red-500/50"
            }} />
              </div>
            </TabsContent>
          </Tabs>}
      </CardContent>
    </Card>;
};