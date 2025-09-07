import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addMinutes, formatISO, set } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

type Rule = {
  weekday: number;
  start_minute: number;
  end_minute: number;
  timezone: string;
  is_active: boolean;
};

type Exception = {
  date: string; // YYYY-MM-DD
  start_minute: number;
  end_minute: number;
  is_available: boolean;
};

function minutesToLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const h12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? "AM" : "PM";
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function generateDates(start: Date, days: number): Date[] {
  const arr: Date[] = [];
  for (let i = 0; i < days; i++) {
    arr.push(addMinutes(start, i * 24 * 60));
  }
  return arr;
}

export function MentorAvailabilityView({ mentorUserId, slotMinutes = 60, horizonDays = 14, onSelectSlot }: {
  mentorUserId: string;
  slotMinutes?: number;
  horizonDays?: number;
  onSelectSlot?: (startIso: string, endIso: string) => void;
}) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [busy, setBusy] = useState<Array<{ start_time: string; end_time: string }>>([]);
  const viewerTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const rangeStart = now.toISOString();
      const rangeEnd = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: r }, { data: e }, { data: be }] = await Promise.all([
        supabase
          .from("mentor_availability_rules")
          .select("weekday, start_minute, end_minute, timezone, is_active")
          .eq("mentor_user_id", mentorUserId)
          .eq("is_active", true),
        supabase
          .from("mentor_availability_exceptions")
          .select("date, start_minute, end_minute, is_available")
          .eq("mentor_user_id", mentorUserId),
        supabase
          .from("bookings")
          .select("start_time, end_time")
          .eq("mentor_user_id", mentorUserId)
          .in("status", ["confirmed", "pending"])
          .gte("start_time", rangeStart)
          .lte("end_time", rangeEnd),
      ]);
      setRules((r || []) as Rule[]);
      setExceptions((e || []) as Exception[]);
      setBusy((be || []) as Array<{ start_time: string; end_time: string }>);
    };
    if (mentorUserId) load();
  }, [mentorUserId, horizonDays]);

  const exceptionMap = useMemo(() => {
    const map = new Map<string, Exception[]>();
    for (const ex of exceptions) {
      const arr = map.get(ex.date) || [];
      arr.push(ex);
      map.set(ex.date, arr);
    }
    return map;
  }, [exceptions]);

  // Build available slots over horizon, considering rules in mentor TZ, convert to viewer TZ, apply exceptions
  const days = useMemo(() => {
    const now = new Date();
    const list = generateDates(new Date(now.getFullYear(), now.getMonth(), now.getDate()), horizonDays);
    return list.map((day) => {
      // Day label and yyyy-mm-dd for exceptions
      const y = day.getFullYear();
      const m = (day.getMonth() + 1).toString().padStart(2, "0");
      const d = day.getDate().toString().padStart(2, "0");
      const key = `${y}-${m}-${d}`;

      // Slots from rules: find matching weekday
      const weekday = day.getDay();
      const dayRules = rules.filter((r) => r.weekday === weekday);
      const slots: { startIso: string; endIso: string; label: string }[] = [];

      for (const r of dayRules) {
        const mentorTz = r.timezone || "UTC";
        // Construct mentor-local Date for this day at rule start/end
        const mentorLocalStart = set(toZonedTime(day, mentorTz), {
          hours: Math.floor(r.start_minute / 60),
          minutes: r.start_minute % 60,
          seconds: 0,
          milliseconds: 0,
        });
        const mentorLocalEnd = set(toZonedTime(day, mentorTz), {
          hours: Math.floor(r.end_minute / 60),
          minutes: r.end_minute % 60,
          seconds: 0,
          milliseconds: 0,
        });

        // Iterate slots in mentor-local then convert to UTC ISO; later we present in viewer tz
        for (
          let cursor = mentorLocalStart;
          cursor < mentorLocalEnd;
          cursor = addMinutes(cursor, slotMinutes)
        ) {
          const slotEnd = addMinutes(cursor, slotMinutes);
          if (slotEnd > mentorLocalEnd) break;

          const startUtc = new Date(cursor.toISOString());
          const endUtc = new Date(slotEnd.toISOString());

          // Exception filter (mentor-local date key)
          const exList = exceptionMap.get(key) || [];
          let allowed = true;
          for (const ex of exList) {
            // Build mentor-local minutes for cursor
            const curMin = (cursor.getHours() * 60) + cursor.getMinutes();
            const curEndMin = curMin + slotMinutes;
            const overlap = Math.max(0, Math.min(curEndMin, ex.end_minute) - Math.max(curMin, ex.start_minute));
            if (overlap > 0) {
              allowed = ex.is_available; // if block, false; if open-extra, true
            }
          }
          if (!allowed) continue;

          // Filter by external busy overlap (UTC intervals)
          const hasBusyOverlap = busy.some((b) => {
            const bStart = new Date(b.start_time).getTime();
            const bEnd = new Date(b.end_time).getTime();
            const s = startUtc.getTime();
            const e = endUtc.getTime();
            return bEnd > s && bStart < e;
          });
          if (hasBusyOverlap) continue;

          // Build label in viewer tz
          const startViewer = toZonedTime(startUtc, viewerTz);
          const endViewer = toZonedTime(endUtc, viewerTz);
          const label = `${startViewer.toLocaleDateString()} ${startViewer.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${endViewer.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;

          slots.push({ startIso: formatISO(startUtc), endIso: formatISO(endUtc), label });
        }
      }

      return { key, date: day, slots };
    });
  }, [rules, exceptionMap, viewerTz, horizonDays, slotMinutes, busy]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.key} className="border rounded-md p-3">
              <div className="text-sm font-medium mb-2">
                {day.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
              <div className="flex flex-wrap gap-2">
                {day.slots.length === 0 && (
                  <div className="text-muted-foreground text-sm">No availability</div>
                )}
                {day.slots.map((s, i) => (
                  <Button key={i} size="sm" variant="outline" onClick={() => onSelectSlot?.(s.startIso, s.endIso)}>
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default MentorAvailabilityView;


