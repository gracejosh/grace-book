import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { uploadToCloudinary } from '@/lib/supabase';
import type { ChatRoom, Message, Profile } from '@/types';
import { MessageCircle, Send, Plus, Users, Hash, Lock, Search, Smile, Image as ImageIcon, Reply, Trash2, Edit2, X, ArrowLeft, Check, Globe, UserCircle } from 'lucide-react';
import { EmptyState } from '@/components/ui';

const EMOJIS = ['😀', '😂', '❤️', '🙏', '🙌', '✨', '🔥', '👏', '😍', '🥰', '😇', '🕊️', '✝️', '📖', '⛪', '🎵', '💪', '🌟', '🙌', '💙'];

type ChatTab = 'global' | 'private';

export default function Chat() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [chatTab, setChatTab] = useState<ChatTab>('global');
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
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
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load rooms
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('chat_rooms').select('*').eq('is_active', true).order('created_at', { ascending: true });
      if (error) {
        showToast('Could not load chat rooms', 'error');
        setLoading(false);
        return;
      }
      setRooms((data as ChatRoom[]) ?? []);
      setLoading(false);
    })();
  }, [showToast]);

  // Load profiles for message senders and private room participants
  const loadProfiles = useCallback(async (ids: string[]) => {
    const uniqueIds = [...new Set(ids)].filter((id) => !profiles[id]);
    if (uniqueIds.length === 0) return;
    const { data } = await supabase.from('profiles').select('*').in('id', uniqueIds);
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        data.forEach((p: Profile) => { next[p.id] = p; });
        return next;
      });
    }
  }, [profiles]);

  // Load messages for selected room
  useEffect(() => {
    if (!selectedRoom) return;
    (async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', selectedRoom.id)
        .order('created_at', { ascending: true })
        .limit(100);
      setMessages((data as Message[]) ?? []);
      setShowMobileChat(true);
      if (data) loadProfiles((data as Message[]).map((m) => m.sender_id).filter(Boolean) as string[]);
    })();

    const channel = supabase
      .channel(`messages:${selectedRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${selectedRoom.id}` }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        if (newMsg.sender_id) loadProfiles([newMsg.sender_id]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${selectedRoom.id}` }, (payload) => {
        const updated = payload.new as Message;
        setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `room_id=eq.${selectedRoom.id}` }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom, loadProfiles]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load profiles for private room participants
  useEffect(() => {
    if (chatTab !== 'private' || !user) return;
    const privateRooms = rooms.filter((r) => r.type === 'private' && r.participants.includes(user.id));
    const otherIds = privateRooms.flatMap((r) => r.participants.filter((id) => id !== user.id));
    loadProfiles(otherIds);
  }, [chatTab, rooms, user, loadProfiles]);

  // User search for private messages
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || !user) {
      setUserResults([]);
      return;
    }
    setUserSearchLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .ilike('username', `%${query}%`)
      .limit(20);
    setUserResults((data as Profile[]) ?? []);
    setUserSearchLoading(false);
  }, [user]);

  const openPrivateRoom = (room: ChatRoom, otherUser: Profile) => {
    setRooms((prev) => prev.some((item) => item.id === room.id) ? prev : [...prev, room]);
    setProfiles((prev) => ({ ...prev, [otherUser.id]: otherUser }));
    setSelectedRoom(room);
    setShowUserSearch(false);
    setShowMobileChat(true);
    setChatTab('private');
  };

  const startPrivateChat = async (otherUser: Profile) => {
    if (!user || otherUser.id === user.id) return;
    const participantIds = [user.id, otherUser.id];
    const existing = rooms.find(
      (room) =>
        room.type === 'private' &&
        room.is_active &&
        room.participants.length === 2 &&
        participantIds.every((id) => room.participants.includes(id))
    );
    if (existing) {
      openPrivateRoom(existing, otherUser);
      return;
    }

    const { data, error } = await supabase.from('chat_rooms').insert({
      name: `Private: ${profile?.username ?? 'You'} & ${otherUser.username ?? 'User'}`,
      type: 'private',
      created_by: user.id,
      participants: participantIds,
      is_active: true,
    }).select().single();
    if (error || !data) {
      showToast('Could not create private chat', 'error');
      return;
    }
    openPrivateRoom(data as ChatRoom, otherUser);
    showToast(`Private chat with ${otherUser.username ?? 'user'} started!`, 'success');
  };

  const sendMessage = async () => {
    if (!user || !selectedRoom || !newMessage.trim()) return;
    const { error } = await supabase.from('messages').insert({
      room_id: selectedRoom.id,
      sender_id: user.id,
      content: newMessage.trim(),
      reply_to: replyTo?.id ?? null,
    });
    if (error) {
      showToast('Could not send message', 'error');
      return;
    }
    setNewMessage('');
    setReplyTo(null);
    setShowEmoji(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedRoom) return;
    try {
      showToast('Uploading...', 'info');
      const url = await uploadToCloudinary(file, file.type.startsWith('image/') ? 'image' : 'raw');
      const { error } = await supabase.from('messages').insert({
        room_id: selectedRoom.id,
        sender_id: user.id,
        content: file.type.startsWith('image/') ? '📷 Image' : `📎 ${file.name}`,
        attachment_url: url,
      });
      if (error) throw error;
      showToast('File sent!', 'success');
    } catch {
      showToast('Upload failed', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteMessage = async (msg: Message) => {
    if (msg.sender_id !== user?.id) return;
    await supabase.from('messages').delete().eq('id', msg.id);
    showToast('Message deleted', 'info');
  };

  const saveEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    await supabase.from('messages').update({ content: editText.trim() }).eq('id', msgId);
    setEditingId(null);
    setEditText('');
  };

  const createRoom = async () => {
    if (!user || !roomName.trim()) return;
    const { data, error } = await supabase.from('chat_rooms').insert({
      name: roomName.trim(),
      type: roomType,
      created_by: user.id,
      participants: [user.id],
      is_active: true,
    }).select().single();
    if (error) {
      showToast('Could not create room', 'error');
      return;
    }
    setRooms((prev) => [...prev, data as ChatRoom]);
    setSelectedRoom(data as ChatRoom);
    setRoomName('');
    setShowNewRoom(false);
    showToast('Room created!', 'success');
  };

  const joinRoom = async (room: ChatRoom) => {
    if (!user) return;
    if (!room.participants.includes(user.id)) {
      await supabase.from('chat_rooms').update({ participants: [...room.participants, user.id] }).eq('id', room.id);
    }
    setSelectedRoom(room);
  };

  // Filter rooms by tab
  const filteredRooms = rooms.filter((r) => {
    const matchesTab = chatTab === 'global' ? r.type === 'public' : r.type === 'private' && (!user || r.participants.includes(user.id));
    return matchesTab && r.name.toLowerCase().includes(search.toLowerCase());
  });

  // Get the other participant's profile for a private room
  const getPrivateRoomPeer = (room: ChatRoom): Profile | null => {
    if (!user) return null;
    const otherId = room.participants.find((id) => id !== user.id);
    return otherId ? profiles[otherId] ?? null : null;
  };

  const formatTime = (iso: string) => {
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
            {chatTab === 'global' ? (
              <button onClick={() => setShowNewRoom(!showNewRoom)} className="p-2 rounded-xl bg-primary-600 text-white hover:scale-105 transition-transform" title="Create room">
                <Plus className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={() => setShowUserSearch(true)} className="p-2 rounded-xl bg-primary-600 text-white hover:scale-105 transition-transform" title="New private message">
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setChatTab('global')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${chatTab === 'global' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Globe className="h-4 w-4" /> Global
            </button>
            <button
              onClick={() => setChatTab('private')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${chatTab === 'private' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <Lock className="h-4 w-4" /> Private
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={chatTab === 'global' ? 'Search rooms...' : 'Search conversations...'} className="input-field pl-10 py-2 text-sm" />
          </div>
        </div>

        <AnimatePresence>
          {showNewRoom && chatTab === 'global' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-slate-200 dark:border-slate-700"
            >
              <div className="p-4 space-y-3">
                <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Room name" className="input-field py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => setRoomType('public')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${roomType === 'public' ? 'bg-primary-600 text-white' : 'glass'}`}>
                    Public
                  </button>
                  <button onClick={() => setRoomType('private')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${roomType === 'private' ? 'bg-primary-600 text-white' : 'glass'}`}>
                    Private
                  </button>
                </div>
                <button onClick={createRoom} className="btn-primary w-full py-2 text-sm">Create Room</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-4 text-center">
              {chatTab === 'private' ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <UserCircle className="h-12 w-12 text-slate-300" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">No private conversations yet</p>
                  <button onClick={() => setShowUserSearch(true)} className="btn-primary py-2 text-sm">
                    <Plus className="h-4 w-4" /> Start a Message
                  </button>
                </div>
              ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm">No rooms found</p>
              )}
            </div>
          ) : (
            filteredRooms.map((room) => {
              const peer = chatTab === 'private' ? getPrivateRoomPeer(room) : null;
              return (
                <button
                  key={room.id}
                  onClick={() => joinRoom(room)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left ${selectedRoom?.id === room.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center shrink-0 overflow-hidden">
                    {chatTab === 'private' && peer ? (
                      peer.avatar_url ? <img src={peer.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-white text-sm font-bold">{peer.username?.charAt(0).toUpperCase() ?? '?'}</span>
                    ) : chatTab === 'private' ? (
                      <UserCircle className="h-5 w-5 text-white" />
                    ) : room.type === 'private' ? (
                      <Lock className="h-5 w-5 text-white" />
                    ) : (
                      <Hash className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {chatTab === 'private' && peer ? peer.username ?? 'Unknown' : room.name}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      {chatTab === 'private' ? (
                        <><Lock className="h-3 w-3" /> Private</>
                      ) : (
                        <><Users className="h-3 w-3" /> {room.participants.length} members</>
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedRoom ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <button onClick={() => setShowMobileChat(false)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center overflow-hidden">
                {selectedRoom.type === 'private' ? (
                  (() => {
                    const peer = getPrivateRoomPeer(selectedRoom);
                    return peer?.avatar_url ? <img src={peer.avatar_url} alt="" className="w-full h-full object-cover" /> : <Lock className="h-5 w-5 text-white" />;
                  })()
                ) : (
                  <Hash className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-bold">
                  {selectedRoom.type === 'private' ? (getPrivateRoomPeer(selectedRoom)?.username ?? 'Private Chat') : selectedRoom.name}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  {selectedRoom.type === 'private' ? (
                    <><Lock className="h-3 w-3" /> Private conversation</>
                  ) : (
                    <><Users className="h-3 w-3" /> {selectedRoom.participants.length} members</>
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No messages yet. Start the conversation!</p>
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
                        {sender?.avatar_url ? <img src={sender.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" /> : (sender?.username?.charAt(0).toUpperCase() ?? '?')}
                      </div>
                      <div className={`max-w-[75%] group ${isOwn ? 'items-end' : ''}`}>
                        <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <span className="text-xs font-semibold">{isOwn ? 'You' : sender?.username ?? 'Unknown'}</span>
                          <span className="text-xs text-slate-400">{formatTime(msg.created_at)}</span>
                        </div>
                        <div className={`rounded-2xl px-4 py-2 ${isOwn ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                          {replyMsg && (
                            <div className={`text-xs mb-1 pb-1 border-b ${isOwn ? 'border-white/20' : 'border-slate-200 dark:border-slate-600'} opacity-70`}>
                              <Reply className="h-3 w-3 inline mr-1" />
                              {replyMsg.content.slice(0, 50)}
                            </div>
                          )}
                          {editingId === msg.id ? (
                            <div className="flex items-center gap-2">
                              <input value={editText} onChange={(e) => setEditText(e.target.value)} className="bg-white/20 rounded-lg px-2 py-1 text-sm flex-1 outline-none" autoFocus />
                              <button onClick={() => saveEdit(msg.id)} className="p-1 hover:bg-white/20 rounded"><Check className="h-3 w-3" /></button>
                              <button onClick={() => setEditingId(null)} className="p-1 hover:bg-white/20 rounded"><X className="h-3 w-3" /></button>
                            </div>
                          ) : (
                            <p className="text-sm">{msg.content}</p>
                          )}
                          {msg.attachment_url && (
                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                              {msg.attachment_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={msg.attachment_url} alt="attachment" className="rounded-lg max-w-full max-h-48" />
                              ) : (
                                <span className="text-xs underline">View attachment</span>
                              )}
                            </a>
                          )}
                        </div>
                        {/* Actions */}
                        {isOwn && editingId !== msg.id && (
                          <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'justify-end' : ''}`}>
                            <button onClick={() => { setReplyTo(msg); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Reply">
                              <Reply className="h-3 w-3 text-slate-400" />
                            </button>
                            <button onClick={() => { setEditingId(msg.id); setEditText(msg.content); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit">
                              <Edit2 className="h-3 w-3 text-slate-400" />
                            </button>
                            <button onClick={() => deleteMessage(msg)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800" title="Delete">
                              <Trash2 className="h-3 w-3 text-slate-400" />
                            </button>
                          </div>
                        )}
                        {!isOwn && (
                          <button onClick={() => setReplyTo(msg)} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
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
                  <span className="text-slate-500">Replying to: {replyTo.content.slice(0, 40)}</span>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-1"><X className="h-3 w-3" /></button>
              </div>
            )}

            {/* Emoji picker */}
            <AnimatePresence>
              {showEmoji && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="p-3 flex flex-wrap gap-1">
                    {EMOJIS.map((e, i) => (
                      <button key={i} onClick={() => { setNewMessage((prev) => prev + e); setShowEmoji(false); }} className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xl transition-transform hover:scale-125">
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
                <button onClick={() => setShowEmoji(!showEmoji)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <Smile className="h-5 w-5 text-slate-400" />
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <ImageIcon className="h-5 w-5 text-slate-400" />
                </button>
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="image/*,*" />
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type a message..."
                  className="flex-1 input-field py-2.5"
                />
                <button onClick={sendMessage} disabled={!newMessage.trim()} className="p-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white disabled:opacity-50 hover:scale-105 transition-transform">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<MessageCircle className="h-8 w-8 text-primary-500" />}
              title={chatTab === 'private' ? 'Select a Conversation' : 'Select a Chat Room'}
              description={chatTab === 'private' ? 'Choose a conversation or start a new private message.' : 'Choose a room from the sidebar to start chatting with the community.'}
            />
          </div>
        )}
      </div>

      {/* User search modal for private chat */}
      <AnimatePresence>
        {showUserSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUserSearch(false)}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-primary-600" /> New Message
                </h3>
                <button onClick={() => setShowUserSearch(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-3">Search for a user by username to start a private conversation.</p>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  placeholder="Search username..."
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-2">
                {userSearchLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
                  </div>
                ) : userResults.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-4">
                    {userSearchQuery ? 'No users found' : 'Type a username to search'}
                  </p>
                ) : (
                  userResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => startPrivateChat(p)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-gold-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                        {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : p.username?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{p.username ?? 'Unknown'}</p>
                        {p.full_name && <p className="text-xs text-slate-500">{p.full_name}</p>}
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400">
                        <Send className="h-4 w-4" /> Message
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
