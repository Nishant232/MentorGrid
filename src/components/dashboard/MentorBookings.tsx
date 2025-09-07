import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function MentorBookings() {
  const queryClient = useQueryClient();

  const { data: pendingBookings = [] } = useQuery({
    queryKey: ["pending-bookings"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return [];

      const { data } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          end_time,
          notes,
          price_cents,
          currency,
          profiles!bookings_mentee_user_id_fkey(full_name)
        `)
        .eq("mentor_user_id", userId)
        .eq("status", "pending")
        .order("start_time", { ascending: true });

      return data || [];
    }
  });

  const { data: confirmedBookings = [] } = useQuery({
    queryKey: ["confirmed-bookings"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return [];

      const { data } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          end_time,
          notes,
          price_cents,
          currency,
          profiles!bookings_mentee_user_id_fkey(full_name)
        `)
        .eq("mentor_user_id", userId)
        .eq("status", "confirmed")
        .order("start_time", { ascending: true });

      return data || [];
    }
  });

  const updateBookingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status } as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pending-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["confirmed-bookings"] });
      toast.success(`Booking ${variables.status === "confirmed" ? "accepted" : "declined"}`);
    }
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Session Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Session Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingBookings.length === 0 ? (
            <p className="text-muted-foreground">No pending requests</p>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking: any) => (
                <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">
                        {booking.profiles?.full_name || 'Student'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Student - {new Date(booking.start_time).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(booking.start_time).toLocaleDateString()} at{' '}
                      {new Date(booking.start_time).toLocaleTimeString()}
                    </div>
                    <div className="mt-1">
                      Duration: {Math.round((new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60))} minutes
                    </div>
                    {booking.notes && (
                      <div className="mt-1">
                        <strong>Notes:</strong> {booking.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateBookingStatus.mutate({ id: booking.id, status: "confirmed" })}
                      disabled={updateBookingStatus.isPending}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBookingStatus.mutate({ id: booking.id, status: "cancelled" })}
                      disabled={updateBookingStatus.isPending}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmed Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmed Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {confirmedBookings.length === 0 ? (
            <p className="text-muted-foreground">No confirmed sessions</p>
          ) : (
            <div className="space-y-4">
              {confirmedBookings.map((booking: any) => (
                <div key={booking.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">
                        {booking.profiles?.full_name || 'Student'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(booking.start_time).toLocaleDateString()} at{' '}
                        {new Date(booking.start_time).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge variant="secondary">Confirmed</Badge>
                  </div>
                  
                  {booking.notes && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Notes:</strong> {booking.notes}
                    </div>
                  )}
                  
                  <div className="text-sm font-medium text-green-600">
                    ${(booking.price_cents / 100).toFixed(2)} {booking.currency}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}