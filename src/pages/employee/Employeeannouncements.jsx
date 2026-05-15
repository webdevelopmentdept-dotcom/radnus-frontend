// EmployeeAnnouncements.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TYPE_CFG = {
  general:     { emoji:"📢", color:"#6b7280", bg:"#f3f4f6", label:"General" },
  urgent:      { emoji:"🚨", color:"#dc2626", bg:"#fef2f2", label:"Urgent",      glow:"rgba(220,38,38,.15)" },
  event:       { emoji:"🎉", color:"#7c3aed", bg:"#f5f3ff", label:"Event",       glow:"rgba(124,58,237,.12)" },
  policy:      { emoji:"📋", color:"#0369a1", bg:"#f0f9ff", label:"Policy" },
  achievement: { emoji:"🏆", color:"#d97706", bg:"#fffbeb", label:"Achievement", glow:"rgba(217,119,6,.12)" },
  holiday:     { emoji:"🌴", color:"#16a34a", bg:"#f0fdf4", label:"Holiday",     glow:"rgba(22,163,74,.12)" },
};

const avatarUrl = (name="?", color="2563eb") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=64&bold=true`;

export default function EmployeeAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [activeFilter,  setActiveFilter]  = useState("all");
  const [lightbox,      setLightbox]      = useState(null);
  const [isMobile,      setIsMobile]      = useState(window.innerWidth < 768);
  const employeeId = localStorage.getItem("employeeId");

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  useEffect(() => { fetchFeed(); }, []);

  const fetchFeed = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/announcements/employee/${employeeId}`);
      if (res.data.success) {
        setAnnouncements(res.data.data || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch {}
    finally { setLoading(false); }
  };

  // Optimistic helpers
  const updateAnn = (id, updater) =>
    setAnnouncements(prev => prev.map(a => a._id === id ? updater(a) : a));

  const markRead = async (id) => {
    const ann = announcements.find(a => a._id === id);
    if (!ann || ann.is_read) return;
    updateAnn(id, a => ({ ...a, is_read: true }));
    setUnreadCount(p => Math.max(0, p - 1));
    try { await axios.put(`${API_BASE}/api/announcements/${id}/read`, { employee_id: employeeId }); } catch {}
  };

  const handleLike = async (id) => {
    updateAnn(id, a => ({
      ...a,
      has_liked:  !a.has_liked,
      like_count: a.has_liked ? a.like_count - 1 : a.like_count + 1
    }));
    try { await axios.put(`${API_BASE}/api/announcements/${id}/like`, { employee_id: employeeId }); } catch {}
  };

  const markAllRead = async () => {
    setAnnouncements(prev => prev.map(a => ({ ...a, is_read: true })));
    setUnreadCount(0);
    for (const a of announcements.filter(x => !x.is_read)) {
      try { await axios.put(`${API_BASE}/api/announcements/${a._id}/read`, { employee_id: employeeId }); } catch {}
    }
  };

  // Comment operations — passed down to cards
  const addComment = async (annId, text) => {
    try {
      const res = await axios.post(`${API_BASE}/api/announcements/${annId}/comments`, { employee_id: employeeId, text });
      if (res.data.success) {
        updateAnn(annId, a => ({
          ...a,
          comments:      [...(a.comments||[]), res.data.data],
          comment_count: res.data.comment_count
        }));
      }
    } catch {}
  };

  const deleteComment = async (annId, commentId) => {
    try {
      const res = await axios.delete(`${API_BASE}/api/announcements/${annId}/comments/${commentId}`, { data: { employee_id: employeeId } });
      if (res.data.success) {
        updateAnn(annId, a => ({
          ...a,
          comments:      (a.comments||[]).filter(c => c._id !== commentId),
          comment_count: res.data.comment_count
        }));
      }
    } catch {}
  };

  const likeComment = async (annId, commentId) => {
    updateAnn(annId, a => ({
      ...a,
      comments: (a.comments||[]).map(c =>
        c._id === commentId
          ? { ...c, has_liked: !c.has_liked, like_count: c.has_liked ? c.like_count-1 : c.like_count+1 }
          : c
      )
    }));
    try { await axios.put(`${API_BASE}/api/announcements/${annId}/comments/${commentId}/like`, { employee_id: employeeId }); } catch {}
  };

  const addReply = async (annId, commentId, text) => {
    try {
      const res = await axios.post(`${API_BASE}/api/announcements/${annId}/comments/${commentId}/replies`, { employee_id: employeeId, text });
      if (res.data.success) {
        updateAnn(annId, a => ({
          ...a,
          comments: (a.comments||[]).map(c =>
            c._id === commentId
              ? { ...c, replies: [...(c.replies||[]), res.data.data] }
              : c
          )
        }));
      }
    } catch {}
  };

  const deleteReply = async (annId, commentId, replyId) => {
    try {
      await axios.delete(`${API_BASE}/api/announcements/${annId}/comments/${commentId}/replies/${replyId}`, { data: { employee_id: employeeId } });
      updateAnn(annId, a => ({
        ...a,
        comments: (a.comments||[]).map(c =>
          c._id === commentId
            ? { ...c, replies: (c.replies||[]).filter(r => r._id !== replyId) }
            : c
        )
      }));
    } catch {}
  };

  const likeReply = async (annId, commentId, replyId) => {
    updateAnn(annId, a => ({
      ...a,
      comments: (a.comments||[]).map(c =>
        c._id === commentId
          ? { ...c, replies: (c.replies||[]).map(r =>
              r._id === replyId
                ? { ...r, has_liked: !r.has_liked, like_count: r.has_liked ? r.like_count-1 : r.like_count+1 }
                : r
            )}
          : c
      )
    }));
    try { await axios.put(`${API_BASE}/api/announcements/${annId}/comments/${commentId}/replies/${replyId}/like`, { employee_id: employeeId }); } catch {}
  };

  const fmtDate = (d) => {
    if (!d) return "";
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60)     return "Just now";
    if (diff < 3600)   return `${Math.floor(diff/60)}m`;
    if (diff < 86400)  return `${Math.floor(diff/3600)}h`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d`;
    return new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
  };

  const filtered = activeFilter==="all" ? announcements
    : activeFilter==="unread" ? announcements.filter(a => !a.is_read)
    : announcements.filter(a => a.type === activeFilter);

  const pinned  = filtered.filter(a => a.is_pinned);
  const regular = filtered.filter(a => !a.is_pinned);

  return (
    <EmployeeLayout>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes heartPop{ 0%{transform:scale(1)}30%{transform:scale(1.5)}60%{transform:scale(.9)}100%{transform:scale(1)} }
        @keyframes shimmer { 0%{background-position:-200% 0}100%{background-position:200% 0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;max-height:0}to{opacity:1;max-height:600px} }

        * { box-sizing: border-box; }
        .feed-card  { animation: fadeUp .3s ease both; }
        .like-btn   { transition: transform .15s; }
        .like-btn:hover { transform: scale(1.15); }
        .liked-heart { animation: heartPop .35s ease; }
        .shimmer-line { background:linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:6px; }

        .comment-item { animation: fadeUp .2s ease; }
        .reply-item   { animation: fadeUp .15s ease; }

        .img-wrap { position:relative;overflow:hidden;background:#111;cursor:pointer; }
        .carousel-track { display:flex;transition:transform .32s cubic-bezier(.4,0,.2,1); }
        .carousel-slide { min-width:100%;object-fit:cover; }
        .c-arrow { position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.52);border:none;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;z-index:3;transition:background .15s; }
        .c-arrow:hover { background:rgba(0,0,0,.78); }

        .lb-bg { position:fixed;inset:0;background:rgba(0,0,0,.96);z-index:3000;display:flex;align-items:center;justify-content:center;animation:fadeUp .2s ease; }

        .comment-input-wrap { display:flex;align-items:center;gap:8px;padding:10px 14px;border-top:1px solid #f3f4f6;background:#fff;position:sticky;bottom:0; }
        .comment-input { flex:1;border:1.5px solid #e5e7eb;border-radius:22px;padding:9px 14px;font-size:13px;outline:none;background:#f8fafc;resize:none;max-height:90px;line-height:1.4;font-family:inherit; }
        .comment-input:focus { border-color:#2563eb;background:#fff; }
        .send-btn { width:34px;height:34px;border-radius:50%;background:#2563eb;border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s; }
        .send-btn:hover { background:#1d4ed8; }
        .send-btn:disabled { background:#93c5fd;cursor:not-allowed; }
      `}</style>

      {/* ── Header ── */}
      <header style={{ background:"#fff",borderBottom:"1px solid #e5e7eb",padding:isMobile?"12px 14px":"14px 24px",position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 6px rgba(0,0,0,.07)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ position:"relative" }}>
              <div style={{ width:38,height:38,borderRadius:11,background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>📢</div>
              {unreadCount > 0 && (
                <div style={{ position:"absolute",top:-5,right:-5,background:"#dc2626",color:"#fff",borderRadius:"50%",minWidth:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,border:"2px solid #fff",padding:"0 3px" }}>
                  {unreadCount > 9?"9+":unreadCount}
                </div>
              )}
            </div>
            <div>
              <h1 style={{ margin:0,fontSize:isMobile?15:18,fontWeight:800,color:"#1a1a2e" }}>Announcements</h1>
              <p style={{ margin:0,fontSize:11,color:"#6b7280" }}>{unreadCount>0?`${unreadCount} unread`:"All caught up ✓"}</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ background:"#eff6ff",color:"#2563eb",border:"1.5px solid #bfdbfe",borderRadius:8,padding:"6px 12px",fontWeight:700,fontSize:11,cursor:"pointer" }}>
              ✓ Mark all read
            </button>
          )}
        </div>
      </header>

      <div style={{ background:"#f0f2f7",minHeight:"100vh",padding:isMobile?"10px 0":"16px" }}>

        {/* Filter chips */}
        <div style={{ display:"flex",gap:7,padding:isMobile?"0 10px 10px":"0 0 14px",overflowX:"auto",scrollbarWidth:"none" }}>
          {[
            { id:"all",     label:`All (${announcements.length})`, emoji:"🏠" },
            { id:"unread",  label:`Unread (${unreadCount})`,        emoji:"🔔" },
            { id:"urgent",  label:"Urgent",  emoji:"🚨" },
            { id:"event",   label:"Events",  emoji:"🎉" },
            { id:"achievement",label:"Wins", emoji:"🏆" },
            { id:"holiday", label:"Holiday", emoji:"🌴" },
            { id:"policy",  label:"Policy",  emoji:"📋" },
          ].map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              style={{ padding:"7px 13px",borderRadius:99,fontSize:11,fontWeight:700,border:`1.5px solid ${activeFilter===f.id?"#2563eb":"#e5e7eb"}`,background:activeFilter===f.id?"#2563eb":"#fff",color:activeFilter===f.id?"#fff":"#6b7280",display:"flex",alignItems:"center",gap:4,flexShrink:0,cursor:"pointer",transition:"all .15s" }}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display:"flex",flexDirection:"column",gap:12,padding:isMobile?"0 0":"0" }}>
            {[1,2].map(i => (
              <div key={i} style={{ background:"#fff",borderRadius:isMobile?0:16,overflow:"hidden" }}>
                <div style={{ display:"flex",gap:10,padding:14 }}>
                  <div className="shimmer-line" style={{ width:36,height:36,borderRadius:50,flexShrink:0 }}/>
                  <div style={{ flex:1 }}>
                    <div className="shimmer-line" style={{ height:12,width:"55%",marginBottom:8 }}/>
                    <div className="shimmer-line" style={{ height:9,width:"35%" }}/>
                  </div>
                </div>
                <div className="shimmer-line" style={{ height:240,borderRadius:0 }}/>
                <div style={{ padding:14 }}>
                  <div className="shimmer-line" style={{ height:11,width:"75%",marginBottom:8 }}/>
                  <div className="shimmer-line" style={{ height:9,width:"50%" }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ background:"#fff",borderRadius:16,padding:"60px 20px",textAlign:"center",margin:isMobile?"0 10px":"0" }}>
            <div style={{ fontSize:52,marginBottom:12 }}>{activeFilter==="unread"?"🎉":"📭"}</div>
            <h3 style={{ color:"#1f2937",marginBottom:6 }}>{activeFilter==="unread"?"All caught up!":"No announcements"}</h3>
            <p style={{ color:"#6b7280",fontSize:13 }}>{activeFilter==="unread"?"You've read everything.":"Nothing here yet."}</p>
          </div>
        )}

        {/* Pinned */}
        {!loading && pinned.length > 0 && (
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,padding:isMobile?"0 14px 8px":"0 0 8px" }}>
              <span style={{ fontSize:11,fontWeight:800,color:"#2563eb",textTransform:"uppercase",letterSpacing:".5px" }}>📌 Pinned</span>
              <div style={{ flex:1,height:1,background:"#bfdbfe" }}/>
            </div>
            {pinned.map((a,i) => (
              <FeedCard key={a._id} ann={a} idx={i} isMobile={isMobile} employeeId={employeeId}
                onRead={markRead} onLike={handleLike} onLightbox={setLightbox} fmtDate={fmtDate}
                onAddComment={addComment} onDeleteComment={deleteComment} onLikeComment={likeComment}
                onAddReply={addReply} onDeleteReply={deleteReply} onLikeReply={likeReply}/>
            ))}
          </div>
        )}

        {/* Regular */}
        {!loading && regular.length > 0 && (
          <div>
            {pinned.length > 0 && (
              <div style={{ display:"flex",alignItems:"center",gap:8,padding:isMobile?"8px 14px":"8px 0" }}>
                <span style={{ fontSize:11,fontWeight:800,color:"#9ca3af",textTransform:"uppercase",letterSpacing:".5px" }}>Latest</span>
                <div style={{ flex:1,height:1,background:"#e5e7eb" }}/>
              </div>
            )}
            {regular.map((a,i) => (
              <FeedCard key={a._id} ann={a} idx={i} isMobile={isMobile} employeeId={employeeId}
                onRead={markRead} onLike={handleLike} onLightbox={setLightbox} fmtDate={fmtDate}
                onAddComment={addComment} onDeleteComment={deleteComment} onLikeComment={likeComment}
                onAddReply={addReply} onDeleteReply={deleteReply} onLikeReply={likeReply}/>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && <LightboxViewer images={lightbox.images} startIdx={lightbox.idx} onClose={() => setLightbox(null)}/>}
    </EmployeeLayout>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FEED CARD
══════════════════════════════════════════════════════════════════════════════ */
function FeedCard({ ann, idx, isMobile, employeeId, onRead, onLike, onLightbox, fmtDate,
  onAddComment, onDeleteComment, onLikeComment, onAddReply, onDeleteReply, onLikeReply }) {

  const cfg        = TYPE_CFG[ann.type] || TYPE_CFG.general;
  const hasImages  = ann.images?.length > 0;
  const [imgIdx, setImgIdx]           = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending]         = useState(false);
  const [expanded, setExpanded]       = useState(false);
  const commentInputRef               = useRef(null);

  const openComments = () => {
    setShowComments(s => !s);
    onRead(ann._id);
    if (!showComments) setTimeout(() => commentInputRef.current?.focus(), 150);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    await onAddComment(ann._id, commentText.trim());
    setCommentText("");
    setSending(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); }
  };

  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e) => {
    if (!touchStart.current) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) setImgIdx(i => Math.min(ann.images.length-1, i+1));
      else          setImgIdx(i => Math.max(0, i-1));
    }
    touchStart.current = null;
  };

  return (
    <div className="feed-card" style={{ background:"#fff",borderRadius:isMobile?0:16,marginBottom:isMobile?10:14,overflow:"hidden",boxShadow:ann.is_pinned?"0 2px 16px rgba(37,99,235,.12)":"0 1px 6px rgba(0,0,0,.07)",animationDelay:`${idx*0.05}s` }}>

      {/* Unread bar */}
      {!ann.is_read && <div style={{ height:3,background:`linear-gradient(90deg,${cfg.color},${cfg.color}77)` }}/>}

      {/* Post header */}
      <div style={{ display:"flex",alignItems:"center",gap:10,padding:"13px 14px 10px" }}>
        <img src={avatarUrl(ann.created_by?.name||"HR", "2563eb")} alt=""
          style={{ width:36,height:36,borderRadius:"50%",flexShrink:0,border:"2px solid #e5e7eb" }}/>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:5,flexWrap:"wrap" }}>
            <span style={{ fontSize:13,fontWeight:700,color:"#1a1a2e" }}>{ann.created_by?.name||"HR Team"}</span>
            <span style={{ fontSize:10,background:cfg.bg,color:cfg.color,padding:"2px 7px",borderRadius:99,fontWeight:700 }}>{cfg.emoji} {cfg.label}</span>
            {ann.is_pinned && <span style={{ fontSize:10,background:"#eff6ff",color:"#2563eb",padding:"2px 6px",borderRadius:99,fontWeight:700 }}>📌</span>}
            {ann.priority==="high" && <span style={{ fontSize:10,background:"#fef2f2",color:"#dc2626",padding:"2px 6px",borderRadius:99,fontWeight:700 }}>🔥</span>}
          </div>
          <p style={{ margin:0,fontSize:10,color:"#9ca3af" }}>{ann.created_by?.designation||"HR"} · {fmtDate(ann.createdAt)}</p>
        </div>
        {!ann.is_read
          ? <span style={{ fontSize:10,background:cfg.bg,color:cfg.color,padding:"3px 8px",borderRadius:99,fontWeight:700,border:`1px solid ${cfg.color}44`,flexShrink:0 }}>● New</span>
          : <span style={{ fontSize:10,background:"#f0fdf4",color:"#16a34a",padding:"3px 8px",borderRadius:99,fontWeight:700,border:"1px solid #bbf7d0",flexShrink:0 }}>✓ Read</span>
        }
      </div>

      {/* Title + content */}
      <div style={{ padding:"0 14px 10px" }}>
        <h3 style={{ margin:"0 0 5px",fontSize:isMobile?14:15,fontWeight:800,color:"#1a1a2e",lineHeight:1.35 }}>
          {ann.emoji && <span style={{ marginRight:5 }}>{ann.emoji}</span>}{ann.title}
        </h3>
        <p style={{ margin:0,fontSize:13,color:"#374151",lineHeight:1.65,
          ...(expanded?{}:{ overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" }) }}>
          {ann.content}
        </p>
        {ann.content?.length > 160 && (
          <button onClick={() => { setExpanded(e=>!e); onRead(ann._id); }}
            style={{ background:"none",border:"none",color:"#2563eb",fontSize:12,fontWeight:700,cursor:"pointer",padding:"3px 0",marginTop:2 }}>
            {expanded?"Less ▲":"More ▼"}
          </button>
        )}
      </div>

      {/* Image carousel */}
      {hasImages && (
        <div className="img-wrap" style={{ height:isMobile?230:300 }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="carousel-track" style={{ transform:`translateX(-${imgIdx*100}%)`,height:"100%" }}>
            {ann.images.map((img,ii) => (
              <img key={ii} src={img.url} alt={img.caption||""} className="carousel-slide"
                style={{ height:"100%",objectFit:"cover" }}
                onClick={() => onLightbox({ images:ann.images, idx:ii })}/>
            ))}
          </div>
          {ann.images.length > 1 && imgIdx > 0 && (
            <button className="c-arrow" onClick={(e)=>{e.stopPropagation();setImgIdx(i=>i-1)}} style={{ left:8 }}>‹</button>
          )}
          {ann.images.length > 1 && imgIdx < ann.images.length-1 && (
            <button className="c-arrow" onClick={(e)=>{e.stopPropagation();setImgIdx(i=>i+1)}} style={{ right:8 }}>›</button>
          )}
          {ann.images[imgIdx]?.caption && (
            <div style={{ position:"absolute",bottom:0,left:0,right:0,background:"linear-gradient(transparent,rgba(0,0,0,.65))",padding:"24px 14px 10px",color:"#fff",fontSize:12,fontWeight:500 }}>
              {ann.images[imgIdx].caption}
            </div>
          )}
          {ann.images.length > 1 && (
            <>
              <div style={{ position:"absolute",top:9,right:10,background:"rgba(0,0,0,.5)",color:"#fff",fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20 }}>
                {imgIdx+1}/{ann.images.length}
              </div>
              <div style={{ position:"absolute",bottom:ann.images[imgIdx]?.caption?36:8,left:0,right:0,display:"flex",justifyContent:"center",gap:5 }}>
                {ann.images.map((_,ii) => (
                  <div key={ii} onClick={(e)=>{e.stopPropagation();setImgIdx(ii)}}
                    style={{ width:ii===imgIdx?16:6,height:6,borderRadius:99,background:ii===imgIdx?"#fff":"rgba(255,255,255,.45)",cursor:"pointer",transition:"all .2s" }}/>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display:"flex",alignItems:"center",gap:16,padding:"11px 14px 8px" }}>
        {/* Like button */}
        <button className={`like-btn${ann.has_liked?" liked-heart":""}`}
          onClick={() => onLike(ann._id)}
          style={{ background:"none",border:"none",display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:0 }}>
          <span style={{ fontSize:22,lineHeight:1,filter:ann.has_liked?"none":"grayscale(1)",transition:"filter .2s" }}>
            {ann.has_liked?"❤️":"🤍"}
          </span>
          <span style={{ fontSize:13,fontWeight:700,color:ann.has_liked?"#dc2626":"#6b7280" }}>{ann.like_count||0}</span>
        </button>

        {/* Comment button */}
        <button onClick={openComments}
          style={{ background:"none",border:"none",display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:0,color:"#6b7280",fontSize:13,fontWeight:700 }}>
          <span style={{ fontSize:18 }}>💬</span> {ann.comment_count||0}
        </button>

        {/* Views */}
        <span style={{ fontSize:12,color:"#9ca3af",display:"flex",alignItems:"center",gap:4 }}>
          <span style={{ fontSize:16 }}>👁</span> {ann.read_count||0}
        </span>
      </div>

      {/* ══ COMMENTS SECTION ══ */}
      {showComments && (
        <div style={{ borderTop:"1px solid #f3f4f6" }}>

          {/* Comments list */}
          <div style={{ maxHeight:380,overflowY:"auto",padding:"8px 14px" }}>
            {(!ann.comments || ann.comments.length === 0) ? (
              <div style={{ textAlign:"center",padding:"20px 0",color:"#9ca3af" }}>
                <div style={{ fontSize:32,marginBottom:8 }}>💬</div>
                <p style={{ margin:0,fontSize:13 }}>No comments yet. Be the first!</p>
              </div>
            ) : (
              ann.comments.map(comment => (
                <CommentItem key={comment._id}
                  comment={comment}
                  annId={ann._id}
                  employeeId={employeeId}
                  fmtDate={fmtDate}
                  onLike={() => onLikeComment(ann._id, comment._id)}
                  onDelete={() => onDeleteComment(ann._id, comment._id)}
                  onAddReply={(text) => onAddReply(ann._id, comment._id, text)}
                  onLikeReply={(rId) => onLikeReply(ann._id, comment._id, rId)}
                  onDeleteReply={(rId) => onDeleteReply(ann._id, comment._id, rId)}
                />
              ))
            )}
          </div>

          {/* Comment input */}
          <div className="comment-input-wrap">
            <img src={avatarUrl("Me","6366f1")} alt="" style={{ width:30,height:30,borderRadius:"50%",flexShrink:0 }}/>
            <textarea
              ref={commentInputRef}
              className="comment-input"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Write a comment..."
              rows={1}
            />
            <button className="send-btn" onClick={submitComment} disabled={sending || !commentText.trim()}>
              {sending
                ? <div style={{ width:14,height:14,border:"2px solid #fff4",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite" }}/>
                : <span style={{ fontSize:16 }}>➤</span>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMMENT ITEM
══════════════════════════════════════════════════════════════════════════════ */
function CommentItem({ comment, annId, employeeId, fmtDate, onLike, onDelete, onAddReply, onLikeReply, onDeleteReply }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText,   setReplyText]   = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [sendingReply,   setSendingReply]   = useState(false);
  const replyInputRef = useRef(null);

  const isOwn = String(comment.employee_id) === String(employeeId);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    await onAddReply(replyText.trim());
    setReplyText("");
    setSendingReply(false);
    setShowReplies(true);
  };

  const openReply = () => {
    setShowReplyInput(s => !s);
    setTimeout(() => replyInputRef.current?.focus(), 100);
  };

  return (
    <div className="comment-item" style={{ marginBottom:14 }}>
      <div style={{ display:"flex",gap:9,alignItems:"flex-start" }}>
        <img src={avatarUrl(comment.name||"E","2563eb")} alt="" style={{ width:30,height:30,borderRadius:"50%",flexShrink:0,marginTop:2 }}/>
        <div style={{ flex:1,minWidth:0 }}>
          {/* Comment bubble */}
          <div style={{ background:"#f3f4f6",borderRadius:"0 14px 14px 14px",padding:"9px 12px",position:"relative" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3 }}>
              <span style={{ fontSize:12,fontWeight:700,color:"#1a1a2e" }}>{comment.name||"Employee"}</span>
              {isOwn && (
                <button onClick={onDelete} style={{ background:"none",border:"none",cursor:"pointer",padding:"0 2px",fontSize:13,color:"#9ca3af",lineHeight:1 }} title="Delete">🗑</button>
              )}
            </div>
            {comment.designation && <p style={{ margin:"0 0 4px",fontSize:10,color:"#9ca3af" }}>{comment.designation}</p>}
            <p style={{ margin:0,fontSize:13,color:"#374151",lineHeight:1.6,wordBreak:"break-word" }}>{comment.text}</p>
          </div>

          {/* Comment actions */}
          <div style={{ display:"flex",alignItems:"center",gap:12,marginTop:5,paddingLeft:4 }}>
            <button onClick={onLike} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3,padding:0,fontSize:12,fontWeight:700,color:comment.has_liked?"#dc2626":"#6b7280" }}>
              <span style={{ fontSize:14,filter:comment.has_liked?"none":"grayscale(1)" }}>❤️</span>
              {comment.like_count > 0 && comment.like_count}
            </button>
            <button onClick={openReply} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,color:"#6b7280",padding:0 }}>
              Reply
            </button>
            {comment.replies?.length > 0 && (
              <button onClick={() => setShowReplies(s=>!s)} style={{ background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:"#2563eb",padding:0 }}>
                {showReplies?"Hide":"View"} {comment.replies.length} {comment.replies.length===1?"reply":"replies"}
              </button>
            )}
            <span style={{ fontSize:10,color:"#9ca3af" }}>{fmtDate(comment.createdAt)}</span>
          </div>

          {/* Reply input */}
          {showReplyInput && (
            <div style={{ display:"flex",gap:7,alignItems:"center",marginTop:8,paddingLeft:4,animation:"slideIn .2s ease" }}>
              <img src={avatarUrl("Me","6366f1")} alt="" style={{ width:24,height:24,borderRadius:"50%",flexShrink:0 }}/>
              <input
                ref={replyInputRef}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter"){e.preventDefault();submitReply();} }}
                placeholder={`Reply to ${comment.name||""}...`}
                style={{ flex:1,border:"1.5px solid #e5e7eb",borderRadius:20,padding:"7px 12px",fontSize:12,outline:"none",fontFamily:"inherit" }}
              />
              <button onClick={submitReply} disabled={sendingReply||!replyText.trim()}
                style={{ width:28,height:28,borderRadius:"50%",background:sendingReply||!replyText.trim()?"#93c5fd":"#2563eb",border:"none",color:"#fff",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {sendingReply?<div style={{ width:10,height:10,border:"2px solid #fff4",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite" }}/>:"➤"}
              </button>
            </div>
          )}

          {/* Replies */}
          {showReplies && comment.replies?.length > 0 && (
            <div style={{ marginTop:8,paddingLeft:8,borderLeft:"2px solid #e5e7eb" }}>
              {comment.replies.map(reply => (
                <ReplyItem key={reply._id} reply={reply} employeeId={employeeId} fmtDate={fmtDate}
                  onLike={() => onLikeReply(reply._id)}
                  onDelete={() => onDeleteReply(reply._id)}/>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reply Item ─────────────────────────────────────────────────────────────── */
function ReplyItem({ reply, employeeId, fmtDate, onLike, onDelete }) {
  const isOwn = String(reply.employee_id) === String(employeeId);
  return (
    <div className="reply-item" style={{ display:"flex",gap:7,alignItems:"flex-start",marginBottom:10 }}>
      <img src={avatarUrl(reply.name||"E","7c3aed")} alt="" style={{ width:24,height:24,borderRadius:"50%",flexShrink:0,marginTop:2 }}/>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ background:"#f8fafc",borderRadius:"0 12px 12px 12px",padding:"7px 10px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2 }}>
            <span style={{ fontSize:11,fontWeight:700,color:"#1a1a2e" }}>{reply.name||"Employee"}</span>
            {isOwn && (
              <button onClick={onDelete} style={{ background:"none",border:"none",cursor:"pointer",padding:0,fontSize:12,color:"#9ca3af" }}>🗑</button>
            )}
          </div>
          <p style={{ margin:0,fontSize:12,color:"#374151",lineHeight:1.55,wordBreak:"break-word" }}>{reply.text}</p>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginTop:4,paddingLeft:3 }}>
          <button onClick={onLike} style={{ background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3,padding:0,fontSize:11,fontWeight:700,color:reply.has_liked?"#dc2626":"#9ca3af" }}>
            <span style={{ fontSize:12,filter:reply.has_liked?"none":"grayscale(1)" }}>❤️</span>
            {reply.like_count > 0 && reply.like_count}
          </button>
          <span style={{ fontSize:10,color:"#9ca3af" }}>{fmtDate(reply.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Lightbox ───────────────────────────────────────────────────────────────── */
function LightboxViewer({ images, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const touchX = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (e.key==="ArrowLeft")  setIdx(i => Math.max(0,i-1));
      if (e.key==="ArrowRight") setIdx(i => Math.min(images.length-1,i+1));
      if (e.key==="Escape")     onClose();
    };
    window.addEventListener("keydown",h);
    return () => window.removeEventListener("keydown",h);
  },[]);

  return (
    <div className="lb-bg" onClick={onClose}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (!touchX.current) return;
        const diff = touchX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 45) {
          if (diff > 0) setIdx(i => Math.min(images.length-1,i+1));
          else          setIdx(i => Math.max(0,i-1));
        }
        touchX.current = null;
      }}>
      <div onClick={e=>e.stopPropagation()} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:14,maxWidth:"96vw" }}>
        {images.length > 1 && (
          <div style={{ background:"rgba(255,255,255,.15)",color:"#fff",fontSize:12,fontWeight:700,padding:"4px 14px",borderRadius:20 }}>
            {idx+1} / {images.length}
          </div>
        )}
        <img src={images[idx].url} alt={images[idx].caption||""}
          style={{ maxWidth:"92vw",maxHeight:"78vh",borderRadius:12,boxShadow:"0 24px 64px rgba(0,0,0,.7)",display:"block" }}/>
        {images[idx].caption && (
          <p style={{ color:"#e2e8f0",fontSize:13,fontWeight:500,textAlign:"center",maxWidth:420,margin:0 }}>{images[idx].caption}</p>
        )}
        {images.length > 1 && (
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <button onClick={()=>setIdx(i=>Math.max(0,i-1))} disabled={idx===0}
              style={{ background:"rgba(255,255,255,.2)",border:"none",color:"#fff",borderRadius:"50%",width:38,height:38,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",opacity:idx===0?.3:1 }}>‹</button>
            <div style={{ display:"flex",gap:6 }}>
              {images.map((_,ii)=>(
                <div key={ii} onClick={()=>setIdx(ii)}
                  style={{ width:ii===idx?18:7,height:7,borderRadius:99,background:ii===idx?"#fff":"rgba(255,255,255,.4)",cursor:"pointer",transition:"all .2s" }}/>
              ))}
            </div>
            <button onClick={()=>setIdx(i=>Math.min(images.length-1,i+1))} disabled={idx===images.length-1}
              style={{ background:"rgba(255,255,255,.2)",border:"none",color:"#fff",borderRadius:"50%",width:38,height:38,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",opacity:idx===images.length-1?.3:1 }}>›</button>
          </div>
        )}
        <button onClick={onClose} style={{ background:"rgba(255,255,255,.15)",border:"none",color:"#fff",borderRadius:8,padding:"8px 22px",cursor:"pointer",fontWeight:600,fontSize:13 }}>✕ Close</button>
      </div>
    </div>
  );
}