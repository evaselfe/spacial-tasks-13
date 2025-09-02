import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, History } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DailyNoteData {
  id?: string;
  date: string;
  activity: string | null;
  is_leave: boolean;
}

export const DailyNote = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activity, setActivity] = useState("");
  const [notes, setNotes] = useState<DailyNoteData[]>([]);
  const [currentNote, setCurrentNote] = useState<DailyNoteData | null>(null);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isToday = selectedDateStr === todayStr;

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const note = notes.find(n => n.date === selectedDateStr);
      setCurrentNote(note || null);
      setActivity(note?.activity || "");
    }
  }, [selectedDate, notes, selectedDateStr]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_notes')
        .select('*')
        .order('date', { ascending: false });

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

    try {
      const noteData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        date: selectedDateStr,
        activity: activity.trim() || null,
        is_leave: !activity.trim()
      };

      if (currentNote) {
        const { error } = await supabase
          .from('daily_notes')
          .update(noteData)
          .eq('id', currentNote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_notes')
          .insert([noteData]);
        if (error) throw error;
      }

      await fetchNotes();
      setIsOpen(false);
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

  return (
    <div className="flex gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Daily Note
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Daily Note - {format(selectedDate, 'PPP')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Daily Activity
              </label>
              <Textarea
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder={isToday ? "What did you do today?" : "View only - cannot edit past dates"}
                className="min-h-[100px]"
                disabled={!isToday}
              />
            </div>
            {isToday && (
              <Button onClick={saveNote} className="w-full">
                Save Activity
              </Button>
            )}
            {!isToday && (
              <p className="text-sm text-muted-foreground text-center">
                You can only edit today's activity
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Popover open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" />
            History
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
                setIsHistoryOpen(false);
                setIsOpen(true);
              }
            }}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              hasActivity: hasActivity,
              onLeave: isOnLeave
            }}
            modifiersClassNames={{
              hasActivity: "bg-green-100 text-green-800 hover:bg-green-200",
              onLeave: "bg-red-100 text-red-800 hover:bg-red-200"
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};