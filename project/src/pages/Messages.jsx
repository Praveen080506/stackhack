import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaImage, FaFileAlt, FaEllipsisV, FaBell, FaBellSlash, FaFlag, FaUserSlash, FaTrash } from "react-icons/fa";
import { notificationsAPI, messagesAPI } from "../utils/api";
import Swal from 'sweetalert2';
import { useAuth } from "../contexts/AuthContext";
import AdminLayout from "../components/AdminLayout";
import UserLayout from "../components/UserLayout";

const dummyConversations = [
  { id: 1, name: "Sarah Chen", lastMessage: "See you tomorrow!", img: "https://i.pravatar.cc/150?img=47" },
  { id: 2, name: "Alex Rodriguez", lastMessage: "Thanks for the help!", img: "https://i.pravatar.cc/150?img=32" },
  { id: 3, name: "Maria Santos", lastMessage: "Let’s start at 5pm.", img: "https://i.pravatar.cc/150?img=14" },
  { id: 4, name: "David Kim", lastMessage: "Got the files.", img: "https://i.pravatar.cc/150?img=55" },
];

function Messages() {
  const location = useLocation();
  const navigate = useNavigate();
  const { code: routeCode } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile } = useAuth();

  const initialRecipient = location?.state?.recipient || null;
  const storedChatRaw = typeof window !== 'undefined' ? localStorage.getItem("lastChatRecipient") : null;
  const storedChat = storedChatRaw ? (() => { try { return JSON.parse(storedChatRaw); } catch { return null; } })() : null;

  const [selectedChat, setSelectedChat] = useState(
    initialRecipient
      ? {
          id: initialRecipient.id || `temp-${Date.now()}`,
          name: initialRecipient.name || "Chat",
          lastMessage: "",
          img: initialRecipient.avatar || "https://i.pravatar.cc/150?img=1",
          conversationId: undefined,
        }
      : null
  );

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const [serverConversations, setServerConversations] = useState([]);
  const [unreadBySender, setUnreadBySender] = useState({});
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const optionsRef = useRef(null);

  // Identity helpers
  const getMeIdentifier = () => String(user?.id || profile?.email || "").toLowerCase();
  const computeConversationId = (otherIdOrEmail) => {
    const me = getMeIdentifier();
    const other = String(otherIdOrEmail || "").toLowerCase();
    if (!me || !other) return null;
    const parts = [me, other].sort();
    return `${parts[0]}__${parts[1]}`;
  };

  // Resolve avatar URLs from backend uploads to absolute URLs
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const resolveAvatar = (u) => {
    if (!u) return u;
    if (typeof u === 'string' && u.startsWith('/uploads')) return `${API_BASE}${u}`;
    return u;
  };

  // Friendly display for peer identifier
  const looksLikeObjectId = (s) => typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s);
  const displayPeerName = (s) => {
    if (!s) return '';
    if (looksLikeObjectId(s)) return 'Admin';
    if (typeof s === 'string' && s.includes('@')) {
      const local = s.split('@')[0];
      const cleaned = local.replace(/[._-]+/g, ' ').trim();
      return cleaned
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
    return s;
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowChatOptions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDeleteChat = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Delete Chat',
      text: 'Are you sure you want to delete this chat? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (isConfirmed) {
      try {
        setServerConversations(prev => prev.filter(c => c.id !== selectedChat.id));
        setSelectedChat(null);

        const messageContainer = document.createElement('div');
        messageContainer.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50';
        messageContainer.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Chat deleted successfully</span>
        `;

        document.body.appendChild(messageContainer);

        setTimeout(() => {
          messageContainer.style.transition = 'opacity 0.5s';
          messageContainer.style.opacity = '0';
          setTimeout(() => {
            if (document.body.contains(messageContainer)) {
              document.body.removeChild(messageContainer);
            }
          }, 500);
        }, 3000);

      } catch (error) {
        console.error('Error deleting chat:', error);
        await Swal.fire({
          title: 'Error',
          text: 'Failed to delete chat. Please try again.',
          icon: 'error',
          confirmButtonColor: '#3085d6',
        });
      }
    }
  };

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const resp = await messagesAPI.conversations();
        const list = Array.isArray(resp?.conversations) ? resp.conversations : [];
        setServerConversations(list);
      } catch (_) {}
    };

    loadConversations();
    const id = setInterval(loadConversations, 15000);
    return () => clearInterval(id);
  }, [selectedChat?.id]);

  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    let timerId;
    let isMounted = true;

    const loadUnread = async () => {
      if (isLoading || (Date.now() - lastFetchTime < 1000)) return;

      setIsLoading(true);
      setLastFetchTime(Date.now());

      try {
        const resp = await notificationsAPI.list();
        if (!isMounted) return;

        const all = Array.isArray(resp?.notifications) ? resp.notifications : [];
        const map = {};
        const readPromises = [];

        setErrorCount(0);

        for (const n of all) {
          if (!n || !n.sender || !n.sender._id) continue;

          if (n.type === "message" && !n.read) {
            const sid = String(n.sender._id);
            map[sid] = (map[sid] || 0) + 1;
          }
        }

        setUnreadBySender(map);

        if (readPromises.length > 0) {
          Promise.all(readPromises)
            .then(() => {
              if (isMounted) {
                window.dispatchEvent(new Event('notifications:update'));
              }
            })
            .catch(e => console.error('Error processing read notifications:', e));
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        const newErrorCount = errorCount + 1;
        setErrorCount(newErrorCount);
        if (newErrorCount > 3) {
          console.warn(`Multiple errors (${newErrorCount}), backing off...`);
          const backoffDelay = Math.min(1000 * Math.pow(2, newErrorCount - 3), 30000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUnread();

    const pollInterval = errorCount > 3 ? 30000 : 10000;
    timerId = setInterval(loadUnread, pollInterval);

    const onNotifUpdate = () => loadUnread();
    window.addEventListener("notifications:update", onNotifUpdate);

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
      try {
        window.removeEventListener("notifications:update", onNotifUpdate);
      } catch (_) {}
    };
  }, [selectedChat?.id, isLoading, lastFetchTime, errorCount]);

  const conversations = useMemo(() => {
    const base = (serverConversations && serverConversations.length > 0)
      ? serverConversations
      : dummyConversations;

    const seed = initialRecipient || storedChat;
    let result = [...base];

    if (seed?.id) {
      const seedIdLower = String(seed.id).toLowerCase();
      const seedConvoId = computeConversationId(seed.id);
      const exists = result.some(c => String(c.id) === String(seedConvoId) || String(c.name).toLowerCase() === seedIdLower);
      if (!exists) {
        result = [
          {
            id: seedConvoId || seed.id || `temp-${Date.now()}`,
            name: seed.name || displayPeerName(seed.id) || "Chat",
            lastMessage: "",
            img: seed.avatar || "https://i.pravatar.cc/150?img=1",
          },
          ...result,
        ];
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(conv =>
        conv.name.toLowerCase().includes(query) ||
        (conv.lastMessage && conv.lastMessage.toLowerCase().includes(query))
      );
    }

    return result;
  }, [serverConversations, initialRecipient, storedChat, searchQuery]);

  const isValidObjectId = (v) => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const parseAttachmentText = (text) => {
    if (typeof text !== 'string') return null;
    const withFiles = text.match(/^Shared\s+(photo|video|document)s?\s*:\s*(.+)$/i);
    const noFiles = text.match(/^Shared\s+(photo|video|document)s?$/i);
    const m = withFiles || noFiles;
    if (!m) return null;
    const type = m[1]?.toLowerCase();
    let files = [];
    if (withFiles && withFiles[2]) {
      files = withFiles[2].split(',').map((s) => s.trim()).filter(Boolean);
    }
    return { kind: 'attachment', attachmentType: type, files };
  };

  const appendAttachmentNote = async (type, files) => {
    const fileArr = Array.from(files || []);
    if (selectedChat?.id && isValidObjectId(String(selectedChat.id))) {
      try {
        const fd = new FormData();
        fd.append('to', String(selectedChat.id));
        fd.append('type', String(type));
        for (const f of fileArr) fd.append('files', f);
        const resp = await messagesAPI.upload(fd);
        const saved = resp?.message;
        setMessages((prev) => {
          if (!saved) return prev;
          const base = {
            id: saved._id,
            sender: 'me',
            text: saved.text,
            at: saved.createdAt,
            attachmentType: saved.attachmentType,
            attachments: Array.isArray(saved.attachments) ? saved.attachments : [],
          };
          const parsed = parseAttachmentText(base.text);
          const filesFromBackend = (base.attachments || []).map((a) => a.originalName).filter(Boolean);
          const enriched = parsed ? { ...base, ...parsed } : base;
          if (filesFromBackend.length) enriched.files = filesFromBackend;
          if (enriched.attachmentType) enriched.kind = 'attachment';
          return [...prev, enriched];
        });
        try {
          await notificationsAPI.create({
            receiverUserId: String(selectedChat.id),
            type: 'message',
            message: saved?.text || 'Shared attachment',
            meta: { fromChat: true, attachment: type },
          });
        } catch (_) {}
      } catch (_) {
        const names = fileArr.map((f) => f.name);
        const plural = names.length > 1 ? 's' : '';
        const textToSend = names.length ? `Shared ${type}${plural}: ${names.join(', ')}` : `Shared ${type}`;
        setMessages((prev) => {
          const base = { sender: 'me', text: textToSend, at: new Date().toISOString(), kind: 'attachment', attachmentType: type, files: names };
          return [...prev, base];
        });
      }
    } else {
      const names = fileArr.map((f) => f.name);
      const plural = names.length > 1 ? 's' : '';
      const textToSend = names.length ? `Shared ${type}${plural}: ${names.join(', ')}` : `Shared ${type}`;
      setMessages((prev) => {
        const base = { sender: 'me', text: textToSend, at: new Date().toISOString(), kind: 'attachment', attachmentType: type, files: names };
        return [...prev, base];
      });
    }
  };

  const handlePickPhoto = () => photoInputRef.current && photoInputRef.current.click();
  const handlePickVideo = () => videoInputRef.current && videoInputRef.current.click();
  const handlePickDoc = () => docInputRef.current && docInputRef.current.click();

  const onPhotoSelected = async (e) => {
    const files = e.target.files;
    if (files && files.length) {
      await appendAttachmentNote("photo", files);
      e.target.value = "";
    }
    setAttachOpen(false);
  };
  const onVideoSelected = async (e) => {
    const files = e.target.files;
    if (files && files.length) {
      await appendAttachmentNote("video", files);
      e.target.value = "";
    }
    setAttachOpen(false);
  };
  const onDocSelected = async (e) => {
    const files = e.target.files;
    if (files && files.length) {
      await appendAttachmentNote("document", files);
      e.target.value = "";
    }
    setAttachOpen(false);
  };

  const getCallRoom = () => {
    if (routeCode) return String(routeCode);
    const byId = serverConversations.find((c) => String(c.id) === String(selectedChat?.id));
    if (byId?.code) return String(byId.code);
    return selectedChat?.id ? String(selectedChat.id) : "general";
  };

  const handleVideoCallClick = () => {
    const room = getCallRoom();
    const url = `https://meet.jit.si/SkillSwap-${encodeURIComponent(room)}?config.prejoinPageEnabled=false`;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error('Error opening video call:', error);
      Swal.fire({
        title: 'Error',
        text: 'Could not start video call. Please try again.',
        icon: 'error'
      });
    }
  };

  const handleAcceptCall = async (callData) => {
    try {
      if (callData.notificationId) {
        await notificationsAPI.markRead(callData.notificationId);
      }
      if (callData.room) {
        window.open(callData.room, "_blank", "noopener,noreferrer");
      }
      setIncomingVideoCall(null);
      await notificationsAPI.create({
        receiverUserId: callData.from,
        type: 'message',
        message: 'Video call accepted',
        meta: {
          kind: 'call_accepted',
          callType: 'video',
          room: callData.room,
          callId: callData.callId,
          from: JSON.parse(localStorage.getItem("skillSwapUser"))._id
        },
      });
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleDeclineCall = async (callData) => {
    try {
      if (callData.notificationId) {
        await notificationsAPI.markRead(callData.notificationId);
      }
      await notificationsAPI.create({
        receiverUserId: callData.from,
        type: 'message',
        message: 'Video call declined',
        meta: {
          kind: 'call_declined',
          callType: 'video',
          callId: callData.callId,
          from: JSON.parse(localStorage.getItem("skillSwapUser"))._id
        },
      });
      setIncomingVideoCall(null);
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  const handleCancelOutgoingCall = async () => {
    if (outgoingVideoCall) {
      try {
        await notificationsAPI.create({
          receiverUserId: outgoingVideoCall.to,
          type: 'message',
          message: 'Video call cancelled',
          meta: {
            kind: 'call_cancelled',
            callType: 'video',
            callId: outgoingVideoCall.callId,
            from: JSON.parse(localStorage.getItem("skillSwapUser"))._id
          },
        });
      } catch (error) {
        console.error('Error cancelling call:', error);
      }
      setOutgoingVideoCall(null);
    }
  };

  const handleAudioCallClick = async () => {
    const room = getCallRoom();
    const url = `https://meet.jit.si/SkillSwap-${encodeURIComponent(room)}?config.startWithVideoMuted=true&config.prejoinPageEnabled=false`;
    try { window.open(url, "_blank", "noopener,noreferrer"); } catch (_) {}
    try {
      if (selectedChat?.id) {
        await notificationsAPI.create({
          receiverUserId: String(selectedChat.id),
          type: 'message',
          message: 'call',
          meta: { kind: 'call', callType: 'audio', room: url },
        });
        try { window.dispatchEvent(new Event('notifications:update')); } catch (_) {}
      }
    } catch (_) {}
  };

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dateLabel = (iso) => {
    try {
      const d = new Date(iso);
      const today = startOfDay(new Date());
      const that = startOfDay(d);
      const diffDays = Math.round((today - that) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      return d.toLocaleDateString();
    } catch {
      return "";
    }
  };

  const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const compareYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (compareDate.getTime() === compareToday.getTime()) {
      return 'Today';
    } else if (compareDate.getTime() === compareYesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  const groupedMessages = React.useMemo(() => {
    const groups = [];
    let currentLabel = null;

    const sortedMessages = [...messages].sort((a, b) => {
      const dateA = new Date(a.at || a.createdAt || new Date().toISOString());
      const dateB = new Date(b.at || b.createdAt || new Date().toISOString());
      return dateA - dateB;
    });

    for (const m of sortedMessages) {
      const messageDate = m.at || m.createdAt || new Date().toISOString();
      const lbl = formatDateLabel(messageDate);

      if (lbl !== currentLabel) {
        groups.push({
          label: lbl,
          items: [m],
          date: new Date(messageDate)
        });
        currentLabel = lbl;
      } else {
        groups[groups.length - 1].items.push(m);
      }
    }

    return groups;
  }, [messages]);

  const emptyQuote = React.useMemo(() => ({
    q: "To teach is to communicate hope, curiosity, and understanding",
    a: "",
  }), []);

  useEffect(() => {
    if (initialRecipient) {
      setSelectedChat({
        id: initialRecipient.id || `temp-${Date.now()}`,
        name: initialRecipient.name || "Chat",
        lastMessage: "",
        img: initialRecipient.avatar || "https://i.pravatar.cc/150?img=1",
        conversationId: computeConversationId(initialRecipient.id),
      });
    }
  }, [initialRecipient]);

  useEffect(() => {
    if (!routeCode || !serverConversations?.length) return;
    const match = serverConversations.find((c) => c.code === routeCode);
    if (match) {
      setSelectedChat({ id: match.id, name: match.name, img: match.img, lastMessage: match.lastMessage, code: match.code });
    }
  }, [routeCode, serverConversations]);

  useEffect(() => {
    if (selectedChat && (selectedChat.id || selectedChat.code)) {
      try {
        localStorage.setItem(
          "lastChatRecipient",
          JSON.stringify({ id: selectedChat.id, name: selectedChat.name, avatar: selectedChat.img, code: selectedChat.code })
        );
      } catch (_) {}
    }
  }, [selectedChat?.id, selectedChat?.name, selectedChat?.img, selectedChat?.code]);

  useEffect(() => {
    const load = async () => {
      try {
        const convoId = selectedChat?.conversationId || (selectedChat?.id ? computeConversationId(selectedChat.id) : null);
        if (convoId) {
          const data = await messagesAPI.listByConversation(convoId);
          const mapped = (data?.messages || []).map((m) => {
            const base = {
              id: m._id || m.id,
              sender: String(m.sender).toLowerCase() === getMeIdentifier() ? "me" : "them",
              text: m.text,
              at: m.createdAt || m.updatedAt,
            };
            const parsed = parseAttachmentText(m.text);
            const enriched = parsed ? { ...base, ...parsed } : base;
            return enriched;
          });
          setMessages(mapped);
        } else if (routeCode) {
          // Fallback: backend doesn't support code; keep empty
          setMessages([]);
        } else {
          setMessages([]);
        }
      } catch (e) {
        setMessages([]);
      }
    };
    load();
  }, [selectedChat?.id, selectedChat?.conversationId, routeCode, user?.id, profile?.email]);

  useEffect(() => {
    const markRead = async () => {
      try {
        if (!selectedChat?.id) return;
        const resp = await notificationsAPI.list();
        const list = Array.isArray(resp?.notifications) ? resp.notifications : [];
        const toMark = list.filter(
          (n) => n.type === "message" && !n.read && (n?.sender?._id && String(n.sender._id) === String(selectedChat.id))
        );
        for (const n of toMark) {
          try { await notificationsAPI.markRead(n._id); } catch (_) {}
        }
        try { window.dispatchEvent(new Event("notifications:update")); } catch (_) {}
      } catch (_) {}
    };
    markRead();
  }, [selectedChat?.id]);

  useEffect(() => {
    const convoId = selectedChat?.conversationId || (selectedChat?.id ? computeConversationId(selectedChat.id) : null);
    if (!convoId) return;
    const id = setInterval(async () => {
      try {
        const data = await messagesAPI.listByConversation(convoId);
        const mapped = (data?.messages || []).map((m) => ({
          id: m._id || m.id,
          sender: String(m.sender).toLowerCase() === getMeIdentifier() ? "me" : "them",
          text: m.text,
          at: m.createdAt || m.updatedAt,
        }));
        setMessages(mapped);
      } catch (_) {}
    }, 5000);
    return () => clearInterval(id);
  }, [selectedChat?.id, selectedChat?.conversationId, user?.id, profile?.email]);

  const handleSend = async () => {
    if (newMessage.trim() === "") return;
    const textToSend = newMessage;
    setNewMessage("");
    const me = getMeIdentifier();
    const other = String(selectedChat?.id || '').toLowerCase();
    const convoId = selectedChat?.conversationId || computeConversationId(other);
    if (!me || !other || !convoId) {
      setMessages((prev) => [...prev, { sender: "me", text: textToSend, at: new Date().toISOString() }]);
      return;
    }
    try {
      const saved = await messagesAPI.sendMessage({
        conversationId: convoId,
        participants: [me, other],
        text: textToSend,
      });
      setMessages((prev) => {
        const base = saved
          ? { id: saved._id || saved.id, sender: "me", text: saved.text, at: saved.createdAt || new Date().toISOString() }
          : { sender: "me", text: textToSend, at: new Date().toISOString() };
        const parsed = parseAttachmentText(base.text);
        return [...prev, (parsed ? { ...base, ...parsed } : base)];
      });
      // Persist convoId into selectedChat for future polls
      setSelectedChat((prev) => prev ? { ...prev, conversationId: convoId } : prev);
    } catch (e) {
      setNewMessage(textToSend);
      return;
    }
  };

  const Wrapper = profile?.role === 'admin' ? AdminLayout : UserLayout;
  return (
    <Wrapper>
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-indigo-50 via-white to-rose-50">
      <div className="h-full max-w-7xl mx-auto flex rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Left: Conversations */}
        <div className="w-[340px] shrink-0 border-r border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 flex flex-col">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-slate-900">Messages</div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-10 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 py-2">
            {conversations.map((conv) => {
              const unreadCount = unreadBySender[String(conv.id)] || 0;
              const hasUnread = unreadCount > 0;
              const lastLocal = (conv.id === selectedChat?.conversationId && messages.length > 0) ? messages[messages.length - 1] : null;
              const lastParsed = lastLocal && (lastLocal.kind === 'attachment' ? lastLocal : parseAttachmentText(lastLocal.text));
              const previewText = lastLocal
                ? (lastParsed ? '' : lastLocal.text)
                : conv.lastMessage;

              const roleLabel = conv.otherRole ? (conv.otherRole === 'admin' ? 'rec' : 'user') : undefined;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    // Backend conversations: conv.id is conversationId; conv.name is peer identifier (email or id)
                    setSelectedChat({ id: conv.name, name: displayPeerName(conv.name), img: resolveAvatar(conv.img), lastMessage: conv.lastMessage, conversationId: conv.id, otherRole: conv.otherRole });
                  }}
                  className={`relative mx-2 mt-2 flex items-center gap-3 p-3.5 cursor-pointer rounded-xl transition
                  ${selectedChat?.conversationId === conv.id ? "bg-indigo-50 ring-1 ring-indigo-100" : "hover:bg-slate-50"}`}
                >
                  <span className="relative">
                    <img
                      src={resolveAvatar(conv.img)}
                      alt={conv.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`truncate ${hasUnread ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}>
                        {displayPeerName(conv.name)}{roleLabel ? ` (${roleLabel})` : ''}
                      </div>
                      {hasUnread && (
                        <span
                          title={`${unreadCount} unread`}
                          className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-2 rounded-full text-[11px] font-semibold bg-indigo-600 text-white"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className={`text-sm truncate w-48 ${hasUnread ? "font-medium text-slate-700" : "text-slate-500"}`}>
                      {previewText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/50">
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-200 sticky top-0 bg-white/80 backdrop-blur z-10">
                <img
                  src={resolveAvatar(selectedChat.img)}
                  alt={selectedChat.name}
                  className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm"
                />
                <div>
                  <div className="font-medium text-slate-900">{selectedChat.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active now
                  </div>
                </div>
                <div className="ml-auto"></div>
              </div>

              {/* Call overlays removed */}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-transparent to-slate-50/70">
                {groupedMessages.map((group, gi) => (
                  <div key={gi} className="mb-6">
                    {/* Date separator */}
                    <div className="flex items-center my-4">
                      <div className="flex-1 border-t border-slate-200"></div>
                      <div className="px-4 text-sm text-slate-500 font-medium">
                        {group.label}
                      </div>
                      <div className="flex-1 border-t border-slate-200"></div>
                    </div>
                    <div className="space-y-4">
                      {group.items.map((msg, idx) => (
                        <div
                          key={`${gi}-${idx}`}
                          className={`group flex items-end gap-2 ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.sender !== "me" && (
                            <img
                              src={resolveAvatar(selectedChat.img)}
                              alt="avatar"
                              className="w-7 h-7 rounded-full shadow-sm"
                            />
                          )}
                          <div className="flex flex-col max-w-[80%] sm:max-w-[70%] lg:max-w-[60%]">
                            <div
                              className={`inline-block px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words align-top shadow-md
                              ${msg.sender === "me" ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white" : "bg-white text-slate-900 border border-slate-200"}`}
                            >
                              {(() => {
                                const parsed = msg.kind === 'attachment' ? { attachmentType: msg.attachmentType } : parseAttachmentText(msg.text);
                                if (parsed) {
                                  const aType = msg.attachmentType || parsed.attachmentType;
                                  const atts = Array.isArray(msg.attachments) ? msg.attachments : [];
                                  if (!atts.length) return null;
                                  return (
                                    <div className="flex items-start gap-2">
                                      {aType === 'document' && (
                                        <FaFileAlt size={14} className={msg.sender === 'me' ? 'text-indigo-100' : 'text-slate-600'} />
                                      )}
                                      <div>
                                        {aType === 'document' ? (
                                          <div className="mt-1 flex flex-col gap-1">
                                            {atts.map((a, i) => {
                                              const url = a?.url && a.url.startsWith('/uploads') ? `http://localhost:5000${a.url}` : a?.url;
                                              return (
                                                <a
                                                  key={i}
                                                  href={url}
                                                  download
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className={msg.sender === 'me'
                                                    ? 'inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/10 ring-1 ring-white/20 text-[12px] text-indigo-50 hover:bg-white/20'
                                                    : 'inline-flex items-center gap-2 px-2 py-1 rounded-md bg-slate-100 ring-1 ring-slate-200 text-[12px] text-slate-800 hover:bg-slate-200'}
                                                >
                                                  {a.originalName || a.filename}
                                                </a>
                                              );
                                            })}
                                          </div>
                                        ) : aType === 'photo' ? (
                                          <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-[280px]">
                                            {atts.map((a, i) => {
                                              const url = a?.url && a.url.startsWith('/uploads') ? `http://localhost:5000${a.url}` : a?.url;
                                              return (
                                                <a key={i} href={url} target="_blank" rel="noreferrer" className="block">
                                                  <img src={url} alt={a.originalName || a.filename} className="w-full h-24 object-cover rounded-lg ring-1 ring-white/20" />
                                                </a>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <div className="mt-1 flex flex-col gap-2 max-w-[280px]">
                                            {atts.map((a, i) => {
                                              const url = a?.url && a.url.startsWith('/uploads') ? `http://localhost:5000${a.url}` : a?.url;
                                              return (
                                                <video key={i} src={url} controls className="w-full rounded-lg max-h-48 ring-1 ring-white/20" />
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                }
                                return (<div>{msg.text}</div>);
                              })()}
                              <div className={`mt-1 text-[10px] ${msg.sender === "me" ? "text-indigo-100/80" : "text-slate-500"} text-right`}>
                                {formatTime(msg.at || msg.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAttachOpen((v) => !v)}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-full text-slate-600 bg-white border border-slate-200 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm"
                      aria-label="Add attachment"
                      title="Share photos, videos or documents"
                    >
                      <FaPlus size={18} />
                    </button>
                    {attachOpen && (
                      <div className="absolute bottom-12 left-0 bg-white border border-slate-200 rounded-xl shadow-xl py-2 w-48 z-20">
                          <button
                            type="button"
                            onClick={handlePickPhoto}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                          >
                            <FaImage size={14} className="text-pink-500" />
                            <span>Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={handlePickVideo}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                          >
                            <FaImage size={14} className="text-emerald-600" />
                            <span>Video</span>
                          </button>
                          <button
                            type="button"
                            onClick={handlePickDoc}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                          >
                            <FaFileAlt size={14} className="text-indigo-600" />
                            <span>Document</span>
                          </button>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-11 px-4 border rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 border-slate-200 shadow-sm"
                  />
                  <button
                    onClick={handleSend}
                    className="h-11 px-5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  >
                    Send
                  </button>

                  <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhotoSelected} />
                  <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={onVideoSelected} />
                  <input
                    ref={docInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,application/*"
                    onChange={onDocSelected}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="max-w-md">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-slate-900">Start a conversation</h3>
                <p className="mt-2 text-slate-500">Select a person on the left to view your chat.</p>
                <blockquote className="mt-6 text-slate-600 italic">“{emptyQuote.q}”</blockquote>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </Wrapper>
  );
}

export default Messages;
