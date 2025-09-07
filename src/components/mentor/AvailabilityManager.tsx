import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

const weekdayLabels = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function timeStringToMinutes(value: string): number | null {
  const m = /^([0-1]?\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

function minutesToTimeString(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

interface AvailabilityManagerProps {
  userId?: string;
}

export function AvailabilityManager({ userId: propUserId }: AvailabilityManagerProps) {
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const systemTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    []
  );

  const [newRule, setNewRule] = useState({
    weekday: 1,
    start: "09:00",
    end: "17:00",
    timezone: systemTz,
    is_active: true,
  });

  const [newEx, setNewEx] = useState({
    date: new Date().toISOString().slice(0, 10),
    start: "09:00",
    end: "12:00",
    is_available: false,
    notes: "",
  });

  useEffect(() => {
    const init = async () => {
      // If userId is provided as prop, use it directly
      if (propUserId) {
        setUserId(propUserId);
        await Promise.all([loadRules(propUserId), loadExceptions(propUserId)]);
        return;
      }
      
      // Otherwise, get the current user's ID
      const auth = await supabase.auth.getUser();
      const uid = auth.data.user?.id || null;
      setUserId(uid);
      if (!uid) return;
      await Promise.all([loadRules(uid), loadExceptions(uid)]);
    };
    init();
  }, [propUserId]);

  const loadRules = async (uid: string) => {
    const { data } = await supabase
      .from("mentor_availability_rules")
      .select("id, mentor_user_id, weekday, start_minute, end_minute, timezone, is_active")
      .eq("mentor_user_id", uid)
      .order("weekday", { ascending: true });
    setRules((data as Rule[]) || []);
  };

  const loadExceptions = async (uid: string) => {
    const { data } = await supabase
      .from("mentor_availability_exceptions")
      .select("id, mentor_user_id, date, start_minute, end_minute, is_available, notes")
      .eq("mentor_user_id", uid)
      .order("date", { ascending: true });
    setExceptions((data as Exception[]) || []);
  };

  const addRule = async () => {
    if (!userId) return;
    const start = timeStringToMinutes(newRule.start);
    const end = timeStringToMinutes(newRule.end);
    if (start === null || end === null || end <= start) return;
    await supabase.from("mentor_availability_rules").insert({
      mentor_user_id: userId,
      weekday: newRule.weekday,
      start_minute: start,
      end_minute: end,
      timezone: newRule.timezone,
      is_active: newRule.is_active,
    });
    await loadRules(userId);
  };

  const deleteRule = async (id: string) => {
    if (!userId) return;
    await supabase.from("mentor_availability_rules").delete().eq("id", id);
    await loadRules(userId);
  };

  const addException = async () => {
    if (!userId) return;
    const start = timeStringToMinutes(newEx.start);
    const end = timeStringToMinutes(newEx.end);
    if (start === null || end === null || end <= start) return;
    await supabase.from("mentor_availability_exceptions").insert({
      mentor_user_id: userId,
      date: newEx.date,
      start_minute: start,
      end_minute: end,
      is_available: newEx.is_available,
      notes: newEx.notes || null,
    });
    await loadExceptions(userId);
  };

  const deleteException = async (id: string) => {
    if (!userId) return;
    await supabase.from("mentor_availability_exceptions").delete().eq("id", id);
    await loadExceptions(userId);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Recurring weekly availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:w-40">
              <Label>Weekday</Label>
              <Select
                value={String(newRule.weekday)}
                onValueChange={(v) => setNewRule((s) => ({ ...s, weekday: parseInt(v, 10) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weekday" />
                </SelectTrigger>
                <SelectContent>
                  {weekdayLabels.map((w, idx) => (
                    <SelectItem key={idx} value={String(idx)}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-28">
              <Label>Start</Label>
              <Input
                type="time"
                value={newRule.start}
                onChange={(e) => setNewRule((s) => ({ ...s, start: e.target.value }))}
              />
            </div>
            <div className="w-full md:w-28">
              <Label>End</Label>
              <Input
                type="time"
                value={newRule.end}
                onChange={(e) => setNewRule((s) => ({ ...s, end: e.target.value }))}
              />
            </div>
            <div className="w-full md:w-56">
              <Label>Timezone</Label>
              <Input
                value={newRule.timezone}
                onChange={(e) => setNewRule((s) => ({ ...s, timezone: e.target.value }))}
                placeholder="IANA timezone, e.g. America/New_York"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newRule.is_active}
                onCheckedChange={(v) => setNewRule((s) => ({ ...s, is_active: v }))}
              />
              <Label>Active</Label>
            </div>
            <Button onClick={addRule}>Add</Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            {rules.length === 0 && (
              <div className="text-sm text-muted-foreground">No rules yet</div>
            )}
            {rules.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{weekdayLabels[r.weekday]}</span>
                  <span className="mx-2">{minutesToTimeString(r.start_minute)} - {minutesToTimeString(r.end_minute)}</span>
                  <span className="text-muted-foreground">{r.timezone}</span>
                  {!r.is_active && <span className="ml-2 rounded bg-muted px-2 py-0.5">inactive</span>}
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteRule(r.id)}>Delete</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exceptions (one-off)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newEx.date}
                  onChange={(e) => setNewEx((s) => ({ ...s, date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Start</Label>
                <Input type="time" value={newEx.start} onChange={(e) => setNewEx((s) => ({ ...s, start: e.target.value }))} />
              </div>
              <div>
                <Label>End</Label>
                <Input type="time" value={newEx.end} onChange={(e) => setNewEx((s) => ({ ...s, end: e.target.value }))} />
              </div>
              <div>
                <Label>Type</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={newEx.is_available}
                    onCheckedChange={(v) => setNewEx((s) => ({ ...s, is_available: v }))}
                  />
                  <Label className="text-sm">{newEx.is_available ? "Open extra" : "Block"}</Label>
                </div>
              </div>
              <div>
                <Label>Action</Label>
                <Button onClick={addException} className="w-full">Add</Button>
              </div>
            </div>
            
            <div>
              <Label>Notes</Label>
              <Input 
                value={newEx.notes} 
                onChange={(e) => setNewEx((s) => ({ ...s, notes: e.target.value }))}
                placeholder="Optional notes for this exception"
                className="w-full"
              />
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            {exceptions.length === 0 && (
              <div className="text-sm text-muted-foreground">No exceptions yet</div>
            )}
            {exceptions.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{ex.date}</span>
                  <span className="mx-2">{minutesToTimeString(ex.start_minute)} - {minutesToTimeString(ex.end_minute)}</span>
                  <span className={ex.is_available ? "text-emerald-600" : "text-rose-600"}>
                    {ex.is_available ? "Open" : "Blocked"}
                  </span>
                  {ex.notes && <span className="ml-2 text-muted-foreground">{ex.notes}</span>}
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteException(ex.id)}>Delete</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AvailabilityManager;


