import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, RotateCw, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EDGE_BASE = `https://gxcfqevjduvbicawefnl.supabase.co/functions/v1`;

type Account = {
  id: string;
  user_id: string;
  provider: "google" | "microsoft";
  email: string;
  sync_enabled: boolean;
  created_at: string;
  updated_at: string;
};

type BusyEvent = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  external_id: string;
};

interface EnhancedCalendarSyncProps {
  userId?: string;
}

export function EnhancedCalendarSync({ userId: propUserId }: EnhancedCalendarSyncProps) {
  const [userId, setUserId] = useState<string | null>(propUserId || null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [busyEvents, setBusyEvents] = useState<BusyEvent[]>([]);
  const [googleEmail, setGoogleEmail] = useState("");
  const [microsoftEmail, setMicrosoftEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      if (propUserId) {
        setUserId(propUserId);
        await Promise.all([loadAccounts(propUserId), loadBusyEvents(propUserId)]);
        return;
      }
      const auth = await supabase.auth.getUser();
      const uid = auth.data.user?.id || null;
      setUserId(uid);
      if (uid) {
        await Promise.all([loadAccounts(uid), loadBusyEvents(uid)]);
      }
    };
    init();
  }, [propUserId]);

  const loadAccounts = async (uid: string) => {
    const { data } = await supabase
      .from("calendar_accounts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setAccounts((data as Account[]) || []);
  };

  const loadBusyEvents = async (uid: string) => {
    const { data } = await supabase
      .from('external_busy_events')
      .select(`
        id, title, start_time, end_time, external_id,
        calendar_accounts!inner(user_id)
      `)
      .eq('calendar_accounts.user_id', uid)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(10);
    
    setBusyEvents(data || []);
  };

  // Enhanced OAuth flow with proper error handling
  const connectViaOAuth = async (provider: "google" | "microsoft", email: string) => {
    if (!userId || !email) return;
    setLoading(true);
    
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      // In a real implementation, this would redirect to OAuth provider
      const authUrl = provider === 'google' 
        ? `https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(window.location.origin)}/auth/callback&scope=https://www.googleapis.com/auth/calendar.readonly&response_type=code&access_type=offline&prompt=consent`
        : `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=${encodeURIComponent(window.location.origin)}/auth/callback&scope=https://graph.microsoft.com/calendars.read`;

      // For demo purposes, simulate OAuth success
      const res = await fetch(`${EDGE_BASE}/calendar-oauth-callback`, {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          "authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ 
          provider, 
          email, 
          user_id: userId, 
          code: "DEMO_AUTH_CODE",
          access_token: "demo_access_token",
          refresh_token: "demo_refresh_token"
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "OAuth connection failed");
      }

      await loadAccounts(userId);
      toast({
        title: "Calendar Connected",
        description: `Successfully connected ${provider} calendar for ${email}`,
      });

      // Clear the email input
      if (provider === 'google') setGoogleEmail("");
      else setMicrosoftEmail("");

    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to connect calendar";
      toast({
        title: "Connection Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeAccount = async (id: string) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from("calendar_accounts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      await loadAccounts(userId);
      toast({
        title: "Account Removed",
        description: "Calendar account has been disconnected",
      });
    } catch (error) {
      toast({
        title: "Removal Failed",
        description: "Failed to remove calendar account",
        variant: "destructive",
      });
    }
  };

  const toggleSync = async (id: string, value: boolean) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from("calendar_accounts")
        .update({ sync_enabled: value })
        .eq("id", id);
      
      if (error) throw error;
      
      await loadAccounts(userId);
      toast({
        title: value ? "Sync Enabled" : "Sync Disabled",
        description: `Calendar sync has been ${value ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update sync settings",
        variant: "destructive",
      });
    }
  };

  const syncNow = async () => {
    if (!userId) return;
    setSyncing(true);
    
    try {
      const res = await fetch(`${EDGE_BASE}/calendar-sync`, { 
        method: "POST",
        headers: {
          "authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Sync failed");
      }
      
      setLastSync(new Date().toISOString());
      await loadBusyEvents(userId);
      
      toast({
        title: "Sync Complete",
        description: `Synced ${result.eventsProcessed || 0} calendar events`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";
      toast({
        title: "Sync Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Google Calendar</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="your-email@gmail.com" 
                  value={googleEmail} 
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  type="email"
                />
                <Button 
                  disabled={loading || !googleEmail} 
                  onClick={() => connectViaOAuth("google", googleEmail)}
                  className="min-w-fit"
                >
                  {loading ? <RotateCw className="h-4 w-4 animate-spin" /> : "Connect"}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Microsoft Calendar</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="your-email@outlook.com" 
                  value={microsoftEmail} 
                  onChange={(e) => setMicrosoftEmail(e.target.value)}
                  type="email"
                />
                <Button 
                  disabled={loading || !microsoftEmail} 
                  onClick={() => connectViaOAuth("microsoft", microsoftEmail)}
                  className="min-w-fit"
                >
                  {loading ? <RotateCw className="h-4 w-4 animate-spin" /> : "Connect"}
                </Button>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="border rounded-lg p-4">
            <div className="font-medium mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Connected Accounts
            </div>
            
            {accounts.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No calendar accounts connected yet
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={acc.provider === 'google' ? 'default' : 'secondary'}>
                        {acc.provider}
                      </Badge>
                      <span className="font-medium">{acc.email}</span>
                      {acc.sync_enabled ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Syncing
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <XCircle className="h-3 w-3 mr-1" />
                          Paused
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={acc.sync_enabled} 
                          onCheckedChange={(v) => toggleSync(acc.id, v)} 
                        />
                        <Label className="text-sm">Sync</Label>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => removeAccount(acc.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sync Controls */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Calendar Sync</span>
              </div>
              {lastSync && (
                <p className="text-sm text-muted-foreground">
                  Last synced: {formatDateTime(lastSync)}
                </p>
              )}
            </div>
            
            <Button 
              variant="outline" 
              onClick={syncNow} 
              disabled={syncing || accounts.filter(a => a.sync_enabled).length === 0}
              className="flex items-center gap-2"
            >
              <RotateCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>

          {/* Upcoming Busy Events */}
          {busyEvents.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Upcoming Busy Times
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {busyEvents.map((event) => (
                  <div key={event.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-muted-foreground">
                        {formatDateTime(event.start_time)} - {formatDateTime(event.end_time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Calendar sync pulls your busy events to prevent double-booking. Connected calendars will automatically 
              block time slots when you have existing appointments.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedCalendarSync;