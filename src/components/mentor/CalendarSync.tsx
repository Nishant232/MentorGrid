import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const EDGE_BASE = `${window.location.origin}/functions/v1`;

type Account = {
  id: string;
  user_id: string;
  provider: "google" | "microsoft";
  email: string;
  sync_enabled: boolean;
  created_at: string;
};

interface CalendarSyncProps {
  userId?: string;
}

export function CalendarSync({ userId: propUserId }: CalendarSyncProps) {
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [googleEmail, setGoogleEmail] = useState("");
  const [microsoftEmail, setMicrosoftEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (propUserId) {
        setUserId(propUserId);
        load(propUserId);
        return;
      }
      const auth = await supabase.auth.getUser();
      const uid = auth.data.user?.id || null;
      setUserId(uid);
      if (uid) load(uid);
    };
    init();
  }, [propUserId]);

  const load = async (uid: string) => {
    const { data } = await supabase
      .from("calendar_accounts")
      .select("id, user_id, provider, email, sync_enabled, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setAccounts((data as Account[]) || []);
  };

  // Minimal OAuth placeholder: call edge function with POST JSON
  const connectViaEdge = async (provider: "google" | "microsoft", email: string) => {
    if (!userId || !email) return;
    setLoading(true);
    try {
      const res = await fetch(`${EDGE_BASE}/calendar-oauth-callback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, email, user_id: userId, code: "DEV_PLACEHOLDER" })
      });
      if (!res.ok) throw new Error("OAuth connect failed");
      await load(userId);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!userId) return;
    await supabase.from("calendar_accounts").delete().eq("id", id);
    await load(userId);
  };

  const toggleSync = async (id: string, value: boolean) => {
    if (!userId) return;
    await supabase.from("calendar_accounts").update({ sync_enabled: value }).eq("id", id);
    await load(userId);
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${EDGE_BASE}/calendar-sync`, { method: "POST" });
      // Optional: display toast with result
      await res.json();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Google account email</Label>
            <div className="flex gap-2">
              <Input placeholder="name@gmail.com" value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} />
              <Button disabled={loading || !googleEmail} onClick={() => connectViaEdge("google", googleEmail)}>Connect</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Microsoft account email</Label>
            <div className="flex gap-2">
              <Input placeholder="name@outlook.com" value={microsoftEmail} onChange={(e) => setMicrosoftEmail(e.target.value)} />
              <Button disabled={loading || !microsoftEmail} onClick={() => connectViaEdge("microsoft", microsoftEmail)}>Connect</Button>
            </div>
          </div>
        </div>

        <div className="border rounded-md p-3">
          <div className="font-medium mb-2">Connected accounts</div>
          {accounts.length === 0 && (
            <div className="text-sm text-muted-foreground">No connected accounts</div>
          )}
          <div className="space-y-2">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium capitalize">{acc.provider}</span>
                  <span className="mx-2">•</span>
                  <span>{acc.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={acc.sync_enabled} onCheckedChange={(v) => toggleSync(acc.id, v)} />
                    <span className="text-sm text-muted-foreground">Sync</span>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => remove(acc.id)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={syncNow} disabled={syncing}>{syncing ? "Syncing..." : "Sync now"}</Button>
          <span className="text-xs text-muted-foreground">Pulls busy events into external_busy_events</span>
        </div>

        <div className="text-xs text-muted-foreground">
          This is a minimal placeholder. In production, clicking Connect should redirect to the provider's OAuth
          consent screen. Tokens are stored securely via the server-side callback.
        </div>
      </CardContent>
    </Card>
  );
}

export default CalendarSync;


