import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Globe, Calendar } from "lucide-react";
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { format, addDays, startOfDay } from 'date-fns';

type Rule = {
  id: string;
  mentor_user_id: string;
  weekday: number;
  start_minute: number;
  end_minute: number;
  timezone: string;
  is_active: boolean;
};

type Exception = {
  id: string;
  mentor_user_id: string;
  date: string;
  start_minute: number;
  end_minute: number;
  is_available: boolean;
  notes: string | null;
};

interface TimeZoneAvailabilityViewProps {
  mentorUserId: string;
  slotMinutes?: number;
  horizonDays?: number;
  onSelectSlot?: (startTime: string, endTime: string) => void;
  viewerTimeZone?: string;
}

const weekdayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function minutesToTimeString(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function generateTimeSlots(startMin: number, endMin: number, slotDuration: number): number[] {
  const slots: number[] = [];
  for (let min = startMin; min < endMin; min += slotDuration) {
    if (min + slotDuration <= endMin) {
      slots.push(min);
    }
  }
  return slots;
}

export function TimeZoneAvailabilityView({ 
  mentorUserId, 
  slotMinutes = 60, 
  horizonDays = 14,
  onSelectSlot,
  viewerTimeZone 
}: TimeZoneAvailabilityViewProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [busyEvents, setBusyEvents] = useState<any[]>([]);
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(
    viewerTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [loading, setLoading] = useState(true);

  // Common time zones for quick selection
  const commonTimeZones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'UTC'
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadRules(),
          loadExceptions(),
          loadBusyEvents()
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    if (mentorUserId) {
      loadData();
    }
  }, [mentorUserId]);

  const loadRules = async () => {
    const { data } = await supabase
      .from("mentor_availability_rules")
      .select("*")
      .eq("mentor_user_id", mentorUserId)
      .eq("is_active", true)
      .order("weekday");
    setRules(data || []);
  };

  const loadExceptions = async () => {
    const { data } = await supabase
      .from("mentor_availability_exceptions")
      .select("*")
      .eq("mentor_user_id", mentorUserId)
      .gte("date", format(new Date(), 'yyyy-MM-dd'))
      .order("date");
    setExceptions(data || []);
  };

  const loadBusyEvents = async () => {
    const { data } = await supabase
      .from('external_busy_events')
      .select(`
        *,
        calendar_accounts!inner(user_id)
      `)
      .eq('calendar_accounts.user_id', mentorUserId)
      .gte('start_time', new Date().toISOString())
      .order('start_time');
    setBusyEvents(data || []);
  };

  const exceptionMap = useMemo(() => {
    const map = new Map<string, Exception[]>();
    exceptions.forEach(ex => {
      const existing = map.get(ex.date) || [];
      existing.push(ex);
      map.set(ex.date, existing);
    });
    return map;
  }, [exceptions]);

  const availabilityData = useMemo(() => {
    const days: Array<{
      date: Date;
      dateString: string;
      dayLabel: string;
      slots: Array<{
        startTime: string;
        endTime: string;
        startTimeLocal: string;
        endTimeLocal: string;
        available: boolean;
      }>;
    }> = [];

    const today = startOfDay(new Date());

    for (let i = 0; i < horizonDays; i++) {
      const date = addDays(today, i);
      const dateString = format(date, 'yyyy-MM-dd');
      const weekday = date.getDay();
      const dayLabel = format(date, 'EEE, MMM d');

      // Find rules for this weekday
      const dayRules = rules.filter(r => r.weekday === weekday);
      const dayExceptions = exceptionMap.get(dateString) || [];

      const slots: any[] = [];

      // Create a Set to track processed time slots to avoid duplicates
      const processedSlots = new Set<string>();

      // Process each rule for this day
      dayRules.forEach(rule => {
        const ruleSlots = generateTimeSlots(rule.start_minute, rule.end_minute, slotMinutes);
        
        ruleSlots.forEach(slotStart => {
          const slotEnd = slotStart + slotMinutes;
          
          // Check if this slot is blocked by exceptions
          const isBlockedByException = dayExceptions.some(ex => 
            !ex.is_available && 
            ex.start_minute < slotEnd && 
            ex.end_minute > slotStart
          );
          
          // Skip if blocked by exception
          if (isBlockedByException) {
            return;
          }
          
          // Create datetime objects in the mentor's timezone
          const mentorTz = rule.timezone;
          const startDateTime = new Date(date);
          startDateTime.setHours(Math.floor(slotStart / 60), slotStart % 60, 0, 0);
          
          const endDateTime = new Date(date);
          endDateTime.setHours(Math.floor(slotEnd / 60), slotEnd % 60, 0, 0);

          // Convert to UTC then to viewer's timezone
          const startUtc = fromZonedTime(startDateTime, mentorTz);
          const endUtc = fromZonedTime(endDateTime, mentorTz);
          
          // Create unique slot key for deduplication
          const slotKey = `${startUtc.toISOString()}-${endUtc.toISOString()}`;
          
          if (processedSlots.has(slotKey)) {
            return; // Skip duplicate slot
          }
          processedSlots.add(slotKey);
          
          // Format in viewer's timezone
          const startTimeLocal = formatInTimeZone(startUtc, selectedTimeZone, 'h:mm a');
          const endTimeLocal = formatInTimeZone(endUtc, selectedTimeZone, 'h:mm a');

          // Check busy events
          const conflictingBusyEvents = busyEvents.filter(event => {
            const eventStart = new Date(event.start_time);
            const eventEnd = new Date(event.end_time);
            return eventStart < endUtc && eventEnd > startUtc;
          });

          const available = conflictingBusyEvents.length === 0;

          // Don't show past slots
          if (startUtc > new Date()) {
            slots.push({
              startTime: startUtc.toISOString(),
              endTime: endUtc.toISOString(),
              startTimeLocal,
              endTimeLocal,
              available
            });
          }
        });
      });

      // Add open exceptions as available slots (these override any rules)
      const openExceptions = dayExceptions.filter(ex => ex.is_available);
      openExceptions.forEach(ex => {
        const exceptionSlots = generateTimeSlots(ex.start_minute, ex.end_minute, slotMinutes);
        
        exceptionSlots.forEach(slotStart => {
          const slotEnd = slotStart + slotMinutes;
          
          const startDateTime = new Date(date);
          startDateTime.setHours(Math.floor(slotStart / 60), slotStart % 60, 0, 0);
          
          const endDateTime = new Date(date);
          endDateTime.setHours(Math.floor(slotEnd / 60), slotEnd % 60, 0, 0);

          // Convert to UTC using the mentor's default timezone (or use system timezone if not available)
          const defaultTz = rules[0]?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
          const startUtc = fromZonedTime(startDateTime, defaultTz);
          const endUtc = fromZonedTime(endDateTime, defaultTz);
          
          // Create unique slot key for deduplication
          const slotKey = `${startUtc.toISOString()}-${endUtc.toISOString()}`;
          
          if (processedSlots.has(slotKey)) {
            return; // Skip if this slot was already added from rules
          }
          processedSlots.add(slotKey);
          
          const startTimeLocal = formatInTimeZone(startUtc, selectedTimeZone, 'h:mm a');
          const endTimeLocal = formatInTimeZone(endUtc, selectedTimeZone, 'h:mm a');

          // Check busy events for open exceptions too
          const conflictingBusyEvents = busyEvents.filter(event => {
            const eventStart = new Date(event.start_time);
            const eventEnd = new Date(event.end_time);
            return eventStart < endUtc && eventEnd > startUtc;
          });

          const available = conflictingBusyEvents.length === 0;

          if (startUtc > new Date()) {
            slots.push({
              startTime: startUtc.toISOString(),
              endTime: endUtc.toISOString(),
              startTimeLocal,
              endTimeLocal,
              available
            });
          }
        });
      });

      // Sort slots by time
      slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      days.push({
        date,
        dateString,
        dayLabel,
        slots
      });
    }

    return days;
  }, [rules, exceptions, busyEvents, selectedTimeZone, slotMinutes, horizonDays, mentorUserId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Available Time Slots
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">Viewing in:</span>
          </div>
          <Select value={selectedTimeZone} onValueChange={setSelectedTimeZone}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {commonTimeZones.map(tz => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {availabilityData.map(day => (
          <div key={day.dateString} className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <h3 className="font-semibold">{day.dayLabel}</h3>
              <Badge variant="outline" className="text-xs">
                {day.slots.filter(s => s.available).length} slots
              </Badge>
            </div>
            
            {day.slots.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                No availability
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {day.slots.map((slot, idx) => (
                  <Button
                    key={idx}
                    variant={slot.available ? "outline" : "ghost"}
                    size="sm"
                    disabled={!slot.available}
                    onClick={() => onSelectSlot?.(slot.startTime, slot.endTime)}
                    className={`
                      text-xs justify-center
                      ${slot.available 
                        ? 'hover:bg-primary hover:text-primary-foreground border-primary/20' 
                        : 'opacity-40 cursor-not-allowed'
                      }
                    `}
                  >
                    {slot.startTimeLocal} - {slot.endTimeLocal}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {availabilityData.every(day => day.slots.filter(s => s.available).length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No available time slots in the next {horizonDays} days</p>
            <p className="text-sm">Please check back later or contact the mentor directly</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TimeZoneAvailabilityView;