import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Search, MoreVertical, Paperclip, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import messageService from "@/services/messageService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Conversation {
  id: string;
  mentor_id: string;
  mentor_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  timestamp: string;
  is_mentor: boolean;
  read: boolean;
  replyTo?: string;
  attachments?: Array<{
    type: string;
    url: string;
    name?: string;
    size?: number;
    mimeType?: string;
  }>;
}

export function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["mentee-conversations"],
    queryFn: async () => {
      const auth = await supabase.auth.getUser();
      const userId = auth.data.user?.id;
      if (!userId) return [];

      // Get conversations with mentors
      const { data: bookings } = await supabase
        .from("bookings")
        .select(`
          mentor_user_id,
          profiles!bookings_mentor_user_id_fkey(full_name, avatar_url)
        `)
        .eq("mentee_user_id", userId)
        .not("mentor_user_id", "is", null);

      // Mock conversations - in a real app, this would come from a messages/conversations table
      const mockConversations: Conversation[] = [
        {
          id: "1",
          mentor_id: "1",
          mentor_name: "Sarah Chen",
          last_message: "Hey, are you free for a quick chat?",
          last_message_time: "2 hours ago",
          unread_count: 1
        },
        {
          id: "2",
          mentor_id: "2",
          mentor_name: "David Lee",
          last_message: "Let's discuss the project roadmap.",
          last_message_time: "1 day ago",
          unread_count: 0
        },
        {
          id: "3",
          mentor_id: "3",
          mentor_name: "Emily Wong",
          last_message: "I've reviewed your code, and it looks great!",
          last_message_time: "2 days ago",
          unread_count: 0
        },
        {
          id: "4",
          mentor_id: "4",
          mentor_name: "Michael Tan",
          last_message: "Looking forward to our next session.",
          last_message_time: "3 days ago",
          unread_count: 0
        },
        {
          id: "5",
          mentor_id: "5",
          mentor_name: "Jessica Lim",
          last_message: "I'm here to help with any questions.",
          last_message_time: "1 week ago",
          unread_count: 0
        }
      ];

      return mockConversations;
    }
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["conversation-messages", selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return [];

      // Mock messages - in a real app, this would fetch from a messages table
      const mockMessages: Message[] = [
        {
          id: "1",
          content: "Hi! How can I help you today?",
          sender_id: "mentor",
          timestamp: "10:00 AM",
          is_mentor: true
        },
        {
          id: "2",
          content: "I have a question about the project we discussed last week.",
          sender_id: "mentee",
          timestamp: "10:02 AM",
          is_mentor: false
        },
        {
          id: "3",
          content: "Of course! What would you like to know?",
          sender_id: "mentor",
          timestamp: "10:03 AM",
          is_mentor: true
        },
        {
          id: "4",
          content: "I'm struggling with implementing the authentication flow.",
          sender_id: "mentee",
          timestamp: "10:05 AM",
          is_mentor: false
        }
      ];

      return mockMessages;
    },
    enabled: !!selectedConversation
  });

  const filteredConversations = conversations.filter(conv =>
    conv.mentor_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    // Connect to socket server when component mounts
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    newSocket.on('newMessage', (message) => {
      // Update messages when a new message is received
      if (selectedConversation === message.threadId) {
        queryClient.invalidateQueries(['conversation-messages', selectedConversation]);
      }
      
      // Update conversation list to show latest message
      queryClient.invalidateQueries(['mentee-conversations']);
    });

    newSocket.on('messageRead', ({ messageId }) => {
      // Update message read status
      queryClient.invalidateQueries(['conversation-messages', selectedConversation]);
    });

    newSocket.on('typing', ({ userId, threadId }) => {
      if (selectedConversation === threadId) {
        setIsTyping(true);
        // Clear typing indicator after 3 seconds
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const unreadMessages = messages.filter(m => !m.read && m.is_mentor);
      if (unreadMessages.length > 0) {
        // Mark messages as read
        unreadMessages.forEach(message => {
          socket?.emit('markAsRead', { messageId: message.id });
        });
      }
    }
  }, [selectedConversation, messages]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedConversation || !user) return;
    
    try {
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return;

      // Prepare form data for attachments
      const formData = new FormData();
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
      
      // Add message content and metadata
      formData.append('content', newMessage.trim());
      formData.append('receiverId', conversation.mentor_id);
      formData.append('threadId', selectedConversation);
      
      if (replyingTo) {
        formData.append('replyTo', replyingTo.id);
      }

      // Send message
      const result = await messageService.sendMessageWithAttachments(formData);
      
      if (result.success) {
        // Clear input and attachments
        setNewMessage('');
        setAttachments([]);
        setReplyingTo(null);
        
        // Emit socket event to notify receiver
        socket?.emit('sendMessage', {
          threadId: selectedConversation,
          receiverId: conversation.mentor_id
        });
        
        // Update messages
        queryClient.invalidateQueries(['conversation-messages', selectedConversation]);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send message',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      // Send typing indicator
      if (selectedConversation && socket) {
        const conversation = conversations.find(c => c.id === selectedConversation);
        if (conversation) {
          socket.emit('typing', {
            threadId: selectedConversation,
            receiverId: conversation.mentor_id
          });
        }
      }
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mentors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedConversation === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold">
                      {conversation.mentor_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate">{conversation.mentor_name}</div>
                        {conversation.unread_count > 0 && (
                          <Badge variant="default" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {conversation.last_message}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conversation.last_message_time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-semibold">
                      {conversations.find(c => c.id === selectedConversation)?.mentor_name[0]}
                    </div>
                    <div>
                      <div className="font-medium">
                        {conversations.find(c => c.id === selectedConversation)?.mentor_name}
                      </div>
                      <div className="text-sm text-muted-foreground">Online</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 h-[400px] flex flex-col">
                {/* Messages */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.is_mentor ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.is_mentor
                            ? 'bg-muted text-foreground'
                            : 'bg-primary text-primary-foreground'
                        }`}
                        onClick={() => handleReply(message)}
                      >
                        {message.replyTo && (
                          <div className="text-xs p-2 mb-2 bg-background/50 rounded border-l-2 border-primary">
                            {messages.find(m => m.id === message.replyTo)?.content || 'Original message not available'}
                          </div>
                        )}
                        <div className="text-sm">{message.content}</div>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center gap-1 text-xs">
                                <Paperclip className="h-3 w-3" />
                                <a 
                                  href={attachment.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="underline hover:text-primary transition-colors"
                                >
                                  {attachment.name || `Attachment ${index + 1}`}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center mt-1">
                          <div className={`text-xs ${
                            message.is_mentor ? 'text-muted-foreground' : 'text-primary-foreground/70'
                          }`}>
                            {message.timestamp}
                          </div>
                          {!message.is_mentor && (
                            <div className="text-xs text-primary-foreground/70">
                              {message.read ? 'Read' : 'Sent'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Message Input */}
                <div className="border-t p-4">
                  {isTyping && (
                    <div className="text-xs text-muted-foreground mb-2">
                      {conversations.find(c => c.id === selectedConversation)?.mentor_name} is typing...
                    </div>
                  )}
                  
                  {replyingTo && (
                    <div className="mb-2 p-2 bg-muted/50 rounded-md flex justify-between items-start">
                      <div>
                        <div className="text-xs font-medium">Replying to</div>
                        <div className="text-sm truncate">{replyingTo.content}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="bg-muted p-1 px-2 rounded-md flex items-center gap-1 text-xs">
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeAttachment(index)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      multiple 
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleFileSelect}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() && attachments.length === 0}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a mentor from the list to start chatting
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
