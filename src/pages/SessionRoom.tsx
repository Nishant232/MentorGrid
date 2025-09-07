import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Star, Mic, MicOff, Video, VideoOff, ScreenShare, StopCircle } from "lucide-react";
import AgoraRTC, { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { videoSessionService, VideoSessionData } from "@/services/videoSessionService";

export default function SessionRoom() {
  const { bookingId } = useParams();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ id: string; message: string; created_at: string }[]>([]);
  const timerRef = useRef<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState<number | null>(5);
  const [feedback, setFeedback] = useState("");
  const [isMentee, setIsMentee] = useState<boolean>(false);
  
  // WebRTC states
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  
  // WebRTC refs
  const rtcClient = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrack = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrack = useRef<ICameraVideoTrack | null>(null);
  const screenTrack = useRef<any | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  
  // Session data
  const [sessionData, setSessionData] = useState<VideoSessionData | null>(null);

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId) return;
      const { data } = await supabase.from("bookings").select("start_time, end_time, mentor_user_id, mentee_user_id, status").eq("id", bookingId).single();
      
      if (data?.end_time) {
        const end = new Date(data.end_time).getTime();
        const now = Date.now();
        setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)));
      }
      
      const auth = await supabase.auth.getUser();
      const uid = auth.data.user?.id;
      if (uid && data) setIsMentee(uid === data.mentee_user_id);
      
      // Initialize video session
      if (data?.status === "confirmed" || data?.status === "in-progress") {
        try {
          const sessionData = await videoSessionService.initializeSession(bookingId);
          setSessionData(sessionData);
          initializeRtcClient(sessionData);
        } catch (error) {
          console.error("Failed to initialize video session:", error);
          toast({
            title: "Error",
            description: "Failed to initialize video session. Please try refreshing the page.",
            variant: "destructive"
          });
        }
      }
    };
    loadBooking();
    
    return () => {
      // Clean up WebRTC resources when component unmounts
      leaveChannel();
    };
  }, [bookingId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  useEffect(() => {
    const sub = supabase
      .channel("session_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "session_messages", filter: `booking_id=eq.${bookingId}` }, (p) => {
        const row = p.new as any;
        setMessages((prev) => [...prev, { id: row.id, message: row.message, created_at: row.created_at }]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [bookingId]);

  useEffect(() => {
    const fetchInitial = async () => {
      if (!bookingId) return;
      const { data } = await supabase
        .from("session_messages")
        .select("id, message, created_at")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchInitial();
  }, [bookingId]);

  const formattedCountdown = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [timeLeft]);

  const sendMessage = async () => {
    if (!bookingId || !chatInput) return;
    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;
    if (!userId) return;
    await supabase.from("session_messages").insert({ booking_id: bookingId, sender_user_id: userId, message: chatInput });
    setChatInput("");
  };

  // Initialize Agora RTC client
  const initializeRtcClient = async (sessionData: VideoSessionData) => {
    if (!sessionData || !sessionData.token || !sessionData.channelName) {
      console.error("Missing session data");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create RTC client
      rtcClient.current = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      
      // Register event handlers
      rtcClient.current.on("user-published", handleUserPublished);
      rtcClient.current.on("user-unpublished", handleUserUnpublished);
      rtcClient.current.on("user-left", handleUserLeft);
      
      // Join the channel
      const uid = await rtcClient.current.join(
        process.env.AGORA_APP_ID || sessionData.appId,
        sessionData.channelName,
        sessionData.token,
        null
      );
      
      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioTrack.current = audioTrack;
      localVideoTrack.current = videoTrack;
      
      await rtcClient.current.publish([audioTrack, videoTrack]);
      
      // Play local video track
      if (localVideoRef.current) {
        localVideoTrack.current.play(localVideoRef.current);
      }
      
      setIsJoined(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error joining RTC channel:", error);
      toast({
        title: "Connection Error",
        description: "Failed to join video session. Please check your camera and microphone permissions.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };
  
  // Handle remote user publishing tracks
  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
    await rtcClient.current?.subscribe(user, mediaType);
    
    setRemoteUsers(prev => {
      if (prev.find(u => u.uid === user.uid)) {
        return prev.map(u => u.uid === user.uid ? user : u);
      } else {
        return [...prev, user];
      }
    });
    
    if (mediaType === "video" && remoteVideoRef.current) {
      user.videoTrack?.play(remoteVideoRef.current);
    }
    
    if (mediaType === "audio") {
      user.audioTrack?.play();
    }
  };
  
  // Handle remote user unpublishing tracks
  const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
    if (mediaType === "video") {
      user.videoTrack?.stop();
    }
    if (mediaType === "audio") {
      user.audioTrack?.stop();
    }
  };
  
  // Handle remote user leaving
  const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
  };
  
  // Toggle microphone
  const toggleMicrophone = async () => {
    if (!localAudioTrack.current) return;
    
    if (isMuted) {
      await localAudioTrack.current.setEnabled(true);
      setIsMuted(false);
    } else {
      await localAudioTrack.current.setEnabled(false);
      setIsMuted(true);
    }
  };
  
  // Toggle camera
  const toggleCamera = async () => {
    if (!localVideoTrack.current) return;
    
    if (isVideoEnabled) {
      await localVideoTrack.current.setEnabled(false);
      setIsVideoEnabled(false);
    } else {
      await localVideoTrack.current.setEnabled(true);
      setIsVideoEnabled(true);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      if (screenTrack.current) {
        await rtcClient.current?.unpublish(screenTrack.current);
        screenTrack.current.close();
        screenTrack.current = null;
      }
      
      // Re-enable camera if it was enabled before
      if (localVideoTrack.current && isVideoEnabled) {
        await rtcClient.current?.publish(localVideoTrack.current);
        if (localVideoRef.current) {
          localVideoTrack.current.play(localVideoRef.current);
        }
      }
      
      setIsScreenSharing(false);
    } else {
      try {
        // Create screen track
        screenTrack.current = await AgoraRTC.createScreenVideoTrack();
        
        // Unpublish camera track if it exists
        if (localVideoTrack.current) {
          await rtcClient.current?.unpublish(localVideoTrack.current);
        }
        
        // Publish screen track
        await rtcClient.current?.publish(screenTrack.current);
        
        if (localVideoRef.current) {
          screenTrack.current.play(localVideoRef.current);
        }
        
        setIsScreenSharing(true);
        
        // Handle screen sharing stopped by user through browser UI
        screenTrack.current.on("track-ended", async () => {
          await toggleScreenShare();
        });
      } catch (error) {
        console.error("Error sharing screen:", error);
        toast({
          title: "Screen Sharing Failed",
          description: "Failed to start screen sharing. Please try again.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Leave the channel and clean up resources
  const leaveChannel = async () => {
    if (localAudioTrack.current) {
      localAudioTrack.current.close();
      localAudioTrack.current = null;
    }
    
    if (localVideoTrack.current) {
      localVideoTrack.current.close();
      localVideoTrack.current = null;
    }
    
    if (screenTrack.current) {
      screenTrack.current.close();
      screenTrack.current = null;
    }
    
    await rtcClient.current?.leave();
    setIsJoined(false);
  };
  
  // End the session
  const endSession = async () => {
    try {
      await videoSessionService.endSession(bookingId);
      leaveChannel();
      setShowFeedback(true);
    } catch (error) {
      console.error("Error ending session:", error);
      toast({
        title: "Error",
        description: "Failed to end session. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Video Session</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[65vh] border rounded-md flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Connecting to session...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[65vh] border rounded-md overflow-hidden relative">
                    {/* Remote video container */}
                    <div 
                      ref={remoteVideoRef} 
                      className="absolute inset-0 bg-black"
                    ></div>
                    
                    {/* Local video container */}
                    <div 
                      ref={localVideoRef} 
                      className="absolute bottom-4 right-4 w-1/4 h-1/4 bg-gray-800 rounded-md overflow-hidden border-2 border-primary"
                    ></div>
                    
                    {/* Video controls */}
                    <div className="absolute bottom-4 left-0 right-0 mx-auto w-fit bg-background/80 backdrop-blur-sm rounded-full p-2 flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={toggleMicrophone}
                              className={`p-3 rounded-full ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-muted hover:bg-muted/80'}`}
                            >
                              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isMuted ? 'Unmute' : 'Mute'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={toggleCamera}
                              className={`p-3 rounded-full ${!isVideoEnabled ? 'bg-red-500/20 text-red-500' : 'bg-muted hover:bg-muted/80'}`}
                            >
                              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button 
                              onClick={toggleScreenShare}
                              className={`p-3 rounded-full ${isScreenSharing ? 'bg-amber-500/20 text-amber-500' : 'bg-muted hover:bg-muted/80'}`}
                            >
                              {isScreenSharing ? <StopCircle size={20} /> : <ScreenShare size={20} />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isScreenSharing ? 'Stop sharing' : 'Share screen'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm">Time left: <span className="font-mono">{formattedCountdown}</span></div>
                  <EnhancedButton variant="destructive" onClick={endSession}>End Session</EnhancedButton>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-[75vh]">
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {messages.map((m) => (
                    <div key={m.id} className="text-sm p-2 bg-muted/40 rounded">{m.message}</div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message" onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                  <EnhancedButton onClick={sendMessage}>Send</EnhancedButton>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isMentee ? "Rate your mentor" : "Share feedback with your mentee"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Rating (1-5)</Label>
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star}`}
                    className="p-1"
                    onClick={() => setRating(star)}
                  >
                    <Star className={`w-6 h-6 ${rating && rating >= star ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Feedback</Label>
              <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Share your thoughts" />
            </div>
            <EnhancedButton
              disabled={!rating}
              onClick={async () => {
                if (!bookingId) return;
                const auth = await supabase.auth.getUser();
                const uid = auth.data.user?.id;
                if (!uid) return;
                // fetch booking to know counterpart
                const { data: b } = await supabase.from("bookings").select("mentor_user_id, mentee_user_id").eq("id", bookingId).single();
                const reviewee = uid === b?.mentor_user_id ? b?.mentee_user_id : b?.mentor_user_id;
                if (reviewee && rating) {
                  await supabase.from("reviews").insert({ booking_id: bookingId, reviewer_user_id: uid, reviewee_user_id: reviewee, rating, feedback });
                }
                await supabase.from("bookings").update({ status: "completed" }).eq("id", bookingId);
                setShowFeedback(false);
              }}
            >Submit</EnhancedButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


