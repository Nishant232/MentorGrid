import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

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
  date: string; // YYYY-MM-DD
  start_minute: number;
  end_minute: number;
  is_available: boolean;
  notes: string | null;
};

type Booking = {
  id: string;
  mentor_user_id: string;
  mentee_user_id: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  status: string;
  mentee_name?: string;
};

type ExternalEvent = {
  id: string;
  user_id: string;
  calendar_account_id: string;
  external_id: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  title: string;
};

interface CalendarViewProps {
  userId?: string;
}

export function CalendarView({ userId: propUserId }: CalendarViewProps) {
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [userTimezone, setUserTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      // If userId is provided as prop, use it directly
      if (propUserId) {
        setUserId(propUserId);
        await loadData(propUserId);
        return;
      }
      
      // Otherwise, get the current user's ID
      const auth = await supabase.auth.getUser();
      const uid = auth.data.user?.id || null;
      setUserId(uid);
      if (uid) await loadData(uid);
      setLoading(false);
    };
    init();
  }, [propUserId]);

  useEffect(() => {
    if (userId) loadData(userId);
  }, [weekStart, userId]);

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      // Get user's timezone preference
      const { data: userData } = await supabase
        .from('mentor_profiles')
        .select('timezone')
        .eq('user_id', uid)
        .single();
      
      if (userData?.timezone) {
        setUserTimezone(userData.timezone);
      }

      // Format dates for query
      const startDate = format(weekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');

      // Load rules
      const { data: rulesData } = await supabase
        .from('mentor_availability_rules')
        .select('*')
        .eq('mentor_user_id', uid);
      setRules(rulesData || []);

      // Load exceptions
      const { data: exceptionsData } = await supabase
        .from('mentor_availability_exceptions')
        .select('*')
        .eq('mentor_user_id', uid)
        .gte('date', startDate)
        .lte('date', endDate);
      setExceptions(exceptionsData || []);

      // Load bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, mentee_profiles(full_name)')
        .eq('mentor_user_id', uid)
        .or(`start_time.gte.${startDate}T00:00:00Z,end_time.lte.${endDate}T23:59:59Z`);
      
      // Transform bookings data to include mentee name
      const transformedBookings = (bookingsData || []).map((booking: any) => ({
        ...booking,
        mentee_name: booking.mentee_profiles?.full_name || 'Unknown Mentee'
      }));
      setBookings(transformedBookings);

      // Skip external calendar events for now - simplify for MVP
      setExternalEvents([]);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = direction === 'next' 
      ? addWeeks(weekStart, 1) 
      : subWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
  };

  const getDayEvents = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    // Get exceptions for this day
    const dayExceptions = exceptions.filter(ex => ex.date === formattedDate);
    
    // Get bookings for this day
    const dayBookings = bookings.filter(booking => {
      const bookingStart = parseISO(booking.start_time);
      return isSameDay(parseISO(formatInTimeZone(bookingStart, userTimezone, 'yyyy-MM-dd')), date);
    });
    
    // Get external events for this day
    const dayExternalEvents = externalEvents.filter(event => {
      const eventStart = parseISO(event.start_time);
      return isSameDay(parseISO(formatInTimeZone(eventStart, userTimezone, 'yyyy-MM-dd')), date);
    });
    
    // Get recurring rules for this day's weekday
    const weekday = date.getDay();
    const dayRules = rules.filter(rule => rule.weekday === weekday && rule.is_active);
    
    return {
      exceptions: dayExceptions,
      bookings: dayBookings,
      externalEvents: dayExternalEvents,
      rules: dayRules
    };
  };

  const minutesToTimeString = (mins: number): string => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const renderDayCell = (date: Date) => {
    const { exceptions, bookings, externalEvents, rules } = getDayEvents(date);
    const formattedDate = format(date, 'EEE, MMM d');
    
    return (
      <div key={formattedDate} className="border rounded-md p-3 min-h-[200px]">
        <div className="font-medium mb-2">{formattedDate}</div>
        
        {/* Recurring availability */}
        {rules.length > 0 && (
          <div className="text-xs mb-2">
            <span className="font-medium">Regular hours:</span>
            {rules.map((rule, idx) => (
              <div key={idx} className="text-emerald-600">
                {minutesToTimeString(rule.start_minute)} - {minutesToTimeString(rule.end_minute)}
              </div>
            ))}
          </div>
        )}
        
        {/* Exceptions */}
        {exceptions.length > 0 && (
          <div className="text-xs mb-2">
            {exceptions.map((ex, idx) => (
              <div key={idx} className={ex.is_available ? "text-emerald-600" : "text-rose-600"}>
                <span className="font-medium">{ex.is_available ? "Extra hours:" : "Blocked:"}</span>
                {minutesToTimeString(ex.start_minute)} - {minutesToTimeString(ex.end_minute)}
                {ex.notes && <div className="text-muted-foreground">{ex.notes}</div>}
              </div>
            ))}
          </div>
        )}
        
        {/* Bookings */}
        {bookings.length > 0 && (
          <div className="text-xs mb-2">
            <span className="font-medium">Bookings:</span>
            {bookings.map((booking, idx) => {
              const startTime = formatInTimeZone(parseISO(booking.start_time), userTimezone, 'HH:mm');
              const endTime = formatInTimeZone(parseISO(booking.end_time), userTimezone, 'HH:mm');
              return (
                <div key={idx} className="bg-blue-100 p-1 rounded mt-1">
                  {startTime} - {endTime}
                  <div className="font-medium">{booking.mentee_name}</div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* External events */}
        {externalEvents.length > 0 && (
          <div className="text-xs">
            <span className="font-medium">External:</span>
            {externalEvents.map((event, idx) => {
              const startTime = formatInTimeZone(parseISO(event.start_time), userTimezone, 'HH:mm');
              const endTime = formatInTimeZone(parseISO(event.end_time), userTimezone, 'HH:mm');
              return (
                <div key={idx} className="bg-gray-100 p-1 rounded mt-1">
                  {startTime} - {endTime}
                  <div className="truncate">{event.title}</div>
                </div>
              );
            })}
          </div>
        )}
        
        {rules.length === 0 && exceptions.length === 0 && bookings.length === 0 && externalEvents.length === 0 && (
          <div className="text-xs text-muted-foreground">No events</div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Calendar View</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            Previous Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            Next Week
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading calendar data...</div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => renderDayCell(addDays(weekStart, i)))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CalendarView;