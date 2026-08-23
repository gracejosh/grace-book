import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { uploadToCloudinary } from '@/lib/supabase';
import type { ChatRoom, Message, Profile } from '@/types';
import { MessageCircle, Send, Plus, Users, Hash, Lock, Search, Smile, Image as ImageIcon, Reply, Trash2, Edit2, X, ArrowLeft, Check, AlertCircle, Loader } from 'lucide-react';
import { EmptyState } from '@/components/ui';

const EMOJIS = ['😀', '😂', '❤️', '🙏', '🙌', '✨', '🔥', '👏', '😍', '🥰', '😇', '🕊️', '✝️', '📖', '⛪', '🎵', '💪', '🌟', '🙌', '💙'];

export default function Chat() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewRoom, setShowNewRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<'public' | 'private'>('public');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const profilesRef = useRef<Record<string, Profile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load rooms
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('💬 Fetching chat rooms from Supabase...');
        
        const { data, error } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Error fetching chat rooms:', error);
          setError(error.message);
          showToast('Could not load chat rooms: ' + error.message, 'error');
          setLoading(false);
          return;
        }

        console.log('✅ Chat rooms fetched:', data?.length, 'rooms found');
        console.log('📊 First room sample:', data?.[0]);
        
        setRooms((data as ChatRoom[]) ?? []);
      } catch (err) {
        console.error('💥 Unexpected error fetching rooms:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        showToast('Unexpected error loading chat rooms', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load profiles for message senders
  const loadProfiles = useCallback(async (ids: string[]) => {
    const uniqueIds = [...new Set(ids)].filter((id) => id && !profilesRef.current[id]);
    if (uniqueIds.length === 0) return;
    
    try {
      console.log('👤 Fetching profiles for users:', uniqueIds);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueIds);
        
      if (error) {
        console.error('❌ Error fetching profiles:', error);
        return;
      }
      
      if (data) {
        console.log('✅ Profiles fetched:', data.length, 'profiles');
        setProfiles((prev) => {
          const next = { ...prev };
          (data as Profile[]).forEach((p) => {
            next[p.id] = p;
          });
          profilesRef.current = next;
          return next;
        });
      }
    } catch (err) {
      console.error('💥 Error loading profiles:', err);
    }
  }, []);

  // Load messages for selected room
  useEffect(() => {
    if (!selectedRoom) {
      console.log('💬 No room selected');
      return;
    }
    
    console.log('💬 Loading messages for room:', selectedRoom.id, selectedRoom.name);
    setLoadingMessages(true);
    
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('room_id', selectedRoom.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) {
          console.error('❌ Error fetching messages:', error);
          showToast('Could not load messages', 'error');
          setLoadingMessages(false);
          return;
        }

        console.log('✅ Messages fetched:', data?.length, 'messages');
        setMessages((data as Message[]) ?? []);
        setShowMobileChat(true);
        
        if (data) {
          const senderIds = (data as Message[])
            .map((m) => m.sender_id)
            .filter(Boolean) as string[];
          if (senderIds.length > 0) {
            loadProfiles(senderIds);
          }
        }
      } catch (err) {
        console.error('💥 Error fetching messages:', err);
        showToast('Error loading messages', 'error');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time changes
    console.log('🔌 Setting up real-time subscription for room:', selectedRoom.id);
    
    const channel = supabase
      .channel(`messages:${selectedRoom.id}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${selectedRoom.id}` }, 
        (payload) => {
          console.log('📨 New message received:', payload.new);
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.sender_id) loadProfiles([newMsg.sender_id]);
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${selectedRoom.id}` }, 
        (payload) => {
          console.log('✏️ Message updated:', payload.new);
          const updated = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${selectedRoom.id}` }, 
        (payload) => {
          console.log('🗑️ Message deleted:', payload.old);
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe((status) => {
        console.log('🔌 Subscription status:', status);
      });

    return () => { 
      console.log('🔌 Removing subscription for room:', selectedRoom.id);
      supabase.removeChannel(channel); 
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !selectedRoom || !newMessage.trim()) {
      console.warn('⚠️ Cannot send message - missing user, room, or message');
      return;
    }
    
    setSendingMessage(true);
    
    try {
      console.log('📤 Sending message to room:', selectedRoom.id);
      
      const { data, error } = await supabase.from('messages').insert({
        room_id: selectedRoom.id,
        sender_id: user.id,
        content: newMessage.trim(),
        reply_to: replyTo?.id ?? null,
      }).select().single();

      if (error) {
        console.error('❌ Error sending message:', error);
        showToast('Could not send message: ' + error.message, 'error');
        return;
      }

      console.log('✅ Message sent successfully:', data);
      setNewMessage('');
      setReplyTo(null);
      setShowEmoji(false);
    } catch (err) {
      console.error('💥 Error sending message:', err);
      showToast('Could not send message', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedRoom) return;
    
    try {
      console.log('📎 Uploading file:', file.name, file.type);
      showToast('Uploading...', 'info');
      const url = await uploadToCloudinary(file, file.type.startsWith('image/') ? 'image' : 'raw');
      console.log('✅ File uploaded to Cloudinary:', url);
      
      const { error } = await supabase.from('messages').insert({
        room_id: selectedRoom.id,
        sender_id: user.id,
        content: file.type.startsWith('image/') ? '📷 Image' : `📎 ${file.name}`,
        attachment_url: url,
      });
      
      if (error) {
        console.error('❌ Error sending file message:', error);
        throw error;
      }
      
      console.log('✅ File message sent successfully');
      showToast('File sent!', 'success');
    } catch (err) {
      console.error('💥 File upload failed:', err);
      showToast('Upload failed', 'error');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteMessage = async (msg: Message) => {
    if (msg.sender_id !== user?.id) return;
    
    try {
      console.log('🗑️ Deleting message:', msg.id);
      const { error } = await supabase.from('messages').delete().eq('id', msg.id);
      
      if (error) {
        console.error('❌ Error deleting message:', error);
        showToast('Could not delete message', 'error');
        return;
      }
      
      console.log('✅ Message deleted successfully');
      showToast('Message deleted', 'info');
    } catch (err) {
      console.error('💥 Error deleting message:', err);
      showToast('Could not delete message', 'error');
    }
  };

  const saveEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    
    try {
      console.log('✏️ Editing message:', msgId);
      const { error } = await supabase
        .from('messages')
        .update({ content: editText.trim() })
        .eq('id', msgId);
        
      if (error) {
        console.error('❌ Error editing message:', error);
        showToast('Could not edit message', 'error');
        return;
      }
      
      console.log('✅ Message edited successfully');
      setEditingId(null);
      setEditText('');
      showToast('Message updated', 'success');
    } catch (err) {
      console.error('💥 Error editing message:', err);
      showToast('Could not edit message', 'error');
    }
  };

  const createRoom = async () => {
    if (!user || !roomName.trim()) return;
    
    try {
      console.log('🏠 Creating new room:', roomName, roomType);
      
      const { data, error } = await supabase.from('chat_rooms').insert({
        name: roomName.trim(),
        type: roomType,
        created_by: user.id,
        participants: [user.id],
        is_active: true,
      }).select().single();
      
      if (error) {
        console.error('❌ Error creating room:', error);
        showToast('Could not create room: ' + error.message, 'error');
        return;
      }

      console.log('✅ Room created successfully:', data);
      setRooms((prev) => [...prev, data as ChatRoom]);
      setSelectedRoom(data as ChatRoom);
      setRoomName('');
      setShowNewRoom(false);
      showToast('Room created!', 'success');
    } catch (err) {
      console.error('💥 Error creating room:', err);
      showToast('Could not create room', 'error');
    }
  };

  const joinRoom = async (room: ChatRoom) => {
    if (!user) return;
    
    console.log('🚪 Joining room:', room.id, room.name);
    
    if (room.participants && !room.participants.includes(user.id)) {
      try {
        const { error } = await supabase
          .from('chat_rooms')
          .update({ participants: [...(room.participants || []), user.id] })
          .eq('id', room.id);
          
        if (error) {
          console.error('❌ Error joining room:', error);
        } else {
          console.log('✅ Joined room successfully');
        }
      } catch (err) {
        console.error('💥 Error joining room:', err);
      }
    }
    
    setSelectedRoom(room);
  };

  const filteredRooms = rooms.filter((r) => 
    r.name?.toLowerCase().includes(search.toLowerCase()) ?? false
  );

  const formatTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <EmptyState
          icon={<MessageCircle className="h-8 w-8 text-primary-500" />}
          title="Sign In to Chat"
          description="Join our global community of believers. Sign in to start messaging, create groups, and connect with fellow Christians worldwide."
        />
      </div>
    );
  }

  // Error state
  if (error && !loading && rooms.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Failed to Load Chat</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <div className={`w-80 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-900 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary-600" />
              Chat
            </h1>
            <button 
              onClick={() => setShowNewRoom(!showNewRoom)} 
              className="p-2 rounded-xl bg-primary-600 text-white hover:scale-105 transition-transform"
              title="Create new room"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search rooms..." 
              className="input-field pl-10 py-2 text-sm" 
            />
          </div>
        </div>

        <AnimatePresence>
          {showNewRoom && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-slate-200 dark:border-slate-700"
            >
              <div className="p-4 space-y-3">
                <input 
                  value={roomName} 
                  onChange={(e) => setRoomName(e.target.value)} 
                  placeholder="Room name" 
                  className="input-field py-2 text-sm" 
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRoomType('public')} 
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${roomType === 'public' ? 'bg-primary-600 text-white' : 'glass'}`}
                  >
                    Public
                  </button>
                  <button 
                    onClick={() => setRoomType('private')} 
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${roomType === 'private' ? 'bg-primary-600 text-white' : 'glass'}`}
                  >
                    Private
                  </button>
                </div>
                <button 
                  onClick={createRoom} 
                  className="btn-primary w-full py-2 text-sm"
                >
                  Create Room
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {rooms.length === 0 ? 'No chat rooms yet. Create one!' : 'No rooms found'}
              </p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => joinRoom(room)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left ${selectedRoom?.id === room.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center shrink-0">
                  {room.type === 'private' ? (
                    <Lock className="h-5 w-5 text-white" />
                  ) : (
                    <Hash className="h-5 w-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{room.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {room.participants?.length || 0} members
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedRoom ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <button 
                onClick={() => setShowMobileChat(false)} 
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center">
                {selectedRoom.type === 'private' ? (
                  <Lock className="h-5 w-5 text-white" />
                ) : (
                  <Hash className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-bold">{selectedRoom.name}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="h-3 w-3" /> {selectedRoom.participants?.length || 0} members
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className="h-8 w-8 animate-spin text-primary-500 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const sender = msg.sender_id ? profiles[msg.sender_id] : null;
                  const isOwn = msg.sender_id === user.id;
                  const replyMsg = msg.reply_to ? messages.find((m) => m.id === msg.reply_to) : null;
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-gold-400 flex items-center justify-center shrink-0 text-white text-xs font-bold overflow-hidden">
                        {sender?.avatar_url ? (
                          <img 
                            src={sender.avatar_url} 
                            alt="" 
                            className="w-full h-full rounded-lg object-cover"
                            onError={(e) => {
                              console.warn('⚠️ Failed to load avatar for:', sender.username);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          sender?.username?.charAt(0).toUpperCase() ?? '?'
                        )}
                      </div>
                      <div className={`max-w-[75%] group ${isOwn ? 'items-end' : ''}`}>
                        <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-semibold">
                            {isOwn ? 'You' : sender?.username ?? 'Unknown'}
                          </span>
                          <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
                        </div>
                        <div className={`rounded-2xl px-4 py-2 ${isOwn ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                          {replyMsg && (
                            <div className={`text-xs mb-1 pb-1 border-b ${isOwn ? 'border-white/20' : 'border-slate-200 dark:border-slate-600'} opacity-70`}>
                              <Reply className="h-3 w-3 inline mr-1" />
                              {replyMsg.content?.slice(0, 50)}
                            </div>
                          )}
                          {editingId === msg.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                value={editText} 
                                onChange={(e) => setEditText(e.target.value)} 
                                className="bg-white/20 rounded-lg px-2 py-1 text-sm flex-1 outline-none" 
                                autoFocus 
                              />
                              <button onClick={() => saveEdit(msg.id)} className="p-1 hover:bg-white/20 rounded">
                                <Check className="h-3 w-3" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/20 rounded">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm">{msg.content}</p>
                              {msg.attachment_url && (
                                <a 
                                  href={msg.attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="mt-2 block"
                                >
                                  {msg.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                    <img 
                                      src={msg.attachment_url} 
                                      alt="attachment" 
                                      className="rounded-lg max-w-full max-h-48"
                                      onError={(e) => {
                                        console.warn('⚠️ Failed to load attachment');
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <span className="text-xs underline">View attachment</span>
                                  )}
                                </a>
                              )}
                            </>
                          )}
                        </div>
                        {/* Actions */}
                        {isOwn && editingId !== msg.id && (
                          <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'justify-end' : ''}`}>
                            <button 
                              onClick={() => { setReplyTo(msg); }} 
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" 
                              title="Reply"
                            >
                              <Reply className="h-3 w-3 text-slate-400" />
                            </button>
                            <button 
                              onClick={() => { setEditingId(msg.id); setEditText(msg.content); }} 
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" 
                              title="Edit"
                            >
                              <Edit2 className="h-3 w-3 text-slate-400" />
                            </button>
                            <button 
                              onClick={() => deleteMessage(msg)} 
                              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" 
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3 text-slate-400" />
                            </button>
                          </div>
                        )}
                        {!isOwn && (
                          <button 
                            onClick={() => setReplyTo(msg)} 
                            className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Reply className="h-3 w-3 text-slate-400" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply preview */}
            {replyTo && (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-xs flex items-center gap-2">
                  <Reply className="h-3 w-3" />
                  <span className="text-slate-500">
                    Replying to: {replyTo.content?.slice(0, 40)}
                  </span>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Emoji picker */}
            <AnimatePresence>
              {showEmoji && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  className="overflow-hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <div className="p-3 flex flex-wrap gap-1">
                    {EMOJIS.map((e, i) => (
                      <button 
                        key={i} 
                        onClick={() => { setNewMessage((prev) => prev + e); setShowEmoji(false); }} 
                        className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xl transition-transform hover:scale-125"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowEmoji(!showEmoji)} 
                  className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Emoji"
                >
                  <Smile className="h-5 w-5 text-slate-400" />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Attach file"
                >
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                </button>
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept="image/*,*" 
                />
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault(); 
                      sendMessage(); 
                    } 
                  }}
                  placeholder="Type a message..."
                  className="flex-1 input-field py-2.5"
                  disabled={sendingMessage}
                />
                <button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || sendingMessage} 
                  className="p-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white disabled:opacity-50 hover:scale-105 transition-transform"
                >
                  {sendingMessage ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<MessageCircle className="h-8 w-8 text-primary-500" />}
              title="Select a Chat Room"
              description="Choose a room from the sidebar to start chatting with the community."
            />
          </div>
        )}
      </div>
    </div>
  );
}
