import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { clearAuth, isLoggedIn, getUser, authHeaders } from "../utils/auth";
import { toast } from "react-hot-toast";

const BASE = "http://localhost:8000";
const todayStr = new Date().toISOString().split("T")[0];

const TASK_STATUS_OPTIONS = ["todo", "in_progress", "review", "done"];
const PRIORITY_OPTIONS    = ["low", "medium", "high", "critical"];

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do", in_progress: "In Progress", review: "In Review", done: "Done",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser: any = getUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [task,        setTask]        = useState<any>(null);
  const [project,     setProject]     = useState<any>(null);
  const [members,     setMembers]     = useState<any[]>([]);
  const [users,       setUsers]       = useState<any[]>([]);
  const [comments,    setComments]    = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);


  const [editingTask, setEditingTask] = useState(false);
  const [title,       setTitle]       = useState("");
  const [desc,        setDesc]        = useState("");
  const [assignee,    setAssignee]    = useState("");
  const [dueDate,     setDueDate]     = useState("");
  const [taskStatus,  setTaskStatus]  = useState("todo");
  const [priority,    setPriority]    = useState("medium");


  const [commentText,        setCommentText]        = useState("");
  const [editingCommentId,   setEditingCommentId]   = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [openMenuId,         setOpenMenuId]         = useState<number | null>(null);
  const [showComments,       setShowComments]       = useState(false);

  
  const isMemberOrOwner = project?.owner_id === currentUser?.id ||
    members.some((m: any) => m.user_id === currentUser?.id);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    loadData();
  }, [id]);

  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const loadData = async () => {
    try {
      const taskRes = await axios.get(`${BASE}/tasks/${id}`, { headers: authHeaders() });
      const t = taskRes.data;
      setTask(t);
      setTitle(t.title);
      setDesc(t.description || "");
      setAssignee(t.assigned_to || "");
      setDueDate(t.due_date ? t.due_date.slice(0, 10) : "");
      setTaskStatus(t.task_status || "todo");
      setPriority(t.priority || "medium");

      const [projectRes, memberRes, userRes, commentRes, attachRes] = await Promise.all([
        axios.get(`${BASE}/projects/${t.project_id}`,                { headers: authHeaders() }),
        axios.get(`${BASE}/project-members/project/${t.project_id}`, { headers: authHeaders() }),
        axios.get(`${BASE}/users/`,                                   { headers: authHeaders() }),
        axios.get(`${BASE}/task-comments/task/${id}`,                { headers: authHeaders() }),
        axios.get(`${BASE}/task-attachments/task/${id}`,             { headers: authHeaders() }),
      ]);

      setProject(projectRes.data);
      setMembers(memberRes.data);
      setUsers(userRes.data);
      setComments(commentRes.data);
      setAttachments(attachRes.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        clearAuth(); navigate("/login"); return;
      }
      toast.error("Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const getUsername = (uid: number) => users.find(u => u.id === uid)?.username ?? "User";

  const canManageComment = (comment: any): boolean => {
    if (!currentUser) return false;
    const uid = currentUser.id;
    return (
      comment.user_id    === uid ||
      project?.owner_id  === uid ||
      task?.assigned_by  === uid
    );
  };

  
  const saveTask = async () => {
    if (!title.trim()) { toast.error("Task title required"); return; }
    if (dueDate && dueDate < todayStr) { toast.error("Due date cannot be in the past"); return; }
    try {
      const res = await axios.put(
        `${BASE}/tasks/${id}`,
        { title, description: desc, assigned_to: assignee || null,
          due_date: dueDate || null, task_status: taskStatus, priority },
        { headers: authHeaders() }
      );
      setTask(res.data);
      setEditingTask(false);
      toast.success("Task updated");
    } catch {
      toast.error("Failed to update task");
    }
  };

  const startEditTask = () => {
    setTitle(task.title);
    setDesc(task.description || "");
    setAssignee(task.assigned_to || "");
    setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
    setTaskStatus(task.task_status || "todo");
    setPriority(task.priority || "medium");
    setEditingTask(true);
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await axios.post(
        `${BASE}/task-comments/`,
        { task_id: Number(id), user_id: currentUser?.id, comment: commentText },
        { headers: authHeaders() }
      );
      setComments(prev => [...prev, res.data]);
      setCommentText("");
    } catch {
      toast.error("Failed to post comment");
    }
  };

  const startEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.comment);
    setOpenMenuId(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const saveEditComment = async (commentId: number) => {
    if (!editingCommentText.trim()) { toast.error("Comment cannot be empty"); return; }
    try {
      const res = await axios.put(
        `${BASE}/task-comments/${commentId}`,
        { comment: editingCommentText },
        { headers: authHeaders() }
      );
      setComments(prev => prev.map(c => c.id === commentId ? res.data : c));
      cancelEditComment();
      toast.success("Comment updated");
    } catch {
      toast.error("Failed to update comment");
    }
  };

  const deleteComment = (commentId: number) => {
    setOpenMenuId(null);
    toast((t) => (
      <div>
        <p className="mb-2 font-medium">Delete this comment?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await axios.delete(`${BASE}/task-comments/${commentId}`, { headers: authHeaders() });
                setComments(prev => prev.filter(c => c.id !== commentId));
                toast.success("Comment deleted");
              } catch {
                toast.error("Failed to delete comment");
              }
            }}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm"
          >
            Yes, Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  
  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("File exceeds 10 MB"); return; }
    const form = new FormData();
    form.append("task_id", String(id));
    form.append("file", file);
    try {
      const token = authHeaders().Authorization;
      const res = await axios.post(`${BASE}/task-attachments/upload`, form, {
        headers: { Authorization: token },
      });
      setAttachments(prev => [...prev, res.data]);
      toast.success(`"${file.name}" uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteAttachment = (attachId: number) => {
    toast((t) => (
      <div>
        <p className="mb-2 font-medium">Remove this attachment?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await axios.delete(`${BASE}/task-attachments/${attachId}`, { headers: authHeaders() });
                setAttachments(prev => prev.filter(a => a.id !== attachId));
                toast.success("Attachment removed");
              } catch {
                toast.error("Failed to remove attachment");
              }
            }}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm"
          >
            Yes, Remove
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-300 rounded text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  if (loading)
    return <div className="flex justify-center items-center h-screen text-gray-500">Loading Task...</div>;

  if (!task)
    return <div className="text-center mt-20 text-gray-500">Task not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">

      <div className="flex justify-between items-center mb-4">
        <Link to={`/projects/${task.project_id}`} className="text-blue-600 text-sm">
          ← {project?.name || "Back to Project"}
        </Link>
        {isMemberOrOwner && (
          <button
            onClick={startEditTask}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            Edit Task
          </button>
        )}
      </div>

      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Task</h2>
            <div className="grid gap-3">
              <input
                className="border p-2 rounded"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="border p-2 rounded"
                placeholder="Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              <select
                className="border p-2 rounded"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              >
                <option value="">Assign Member</option>
                {members.map((m) => {
                  const u = users.find((u) => u.id === m.user_id);
                  return u ? (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ) : null;
                })}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <select className="border p-2 rounded w-full" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
                    {TASK_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Priority</label>
                  <select className="border p-2 rounded w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">Due Date</label>
                <input
                  type="date"
                  min={todayStr}
                  className="border p-2 rounded w-full"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingTask(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button onClick={saveTask} className="px-4 py-2 bg-blue-600 text-white rounded">Update Task</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Comments ({comments.length})</h2>
            {isMemberOrOwner && (
              <div className="flex gap-2 mb-4">
                <input
                  className="border p-2 rounded flex-1"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addComment(); }}
                />
                <button
                  onClick={addComment}
                  className="bg-blue-500 text-white px-4 rounded"
                >
                  Post
                </button>
              </div>
            )}

            <button
              onClick={() => setShowComments(prev => !prev)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
            >
              <span>{showComments ? "▲" : "▼"}</span>
              <span>{showComments ? "Hide" : "Show"} Comments ({comments.length})</span>
            </button>

            {showComments && (
              <div className="space-y-3">
                {comments.length === 0 && (
                  <p className="text-gray-400 text-sm">No comments yet.</p>
                )}

                {comments.map((c) => (
                  <div key={c.id} className="border p-3 rounded">
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-gray-400">
                        <span className="font-semibold text-gray-700">
                          {c.user?.username || getUsername(c.user_id)}
                        </span>
                        {" · "}
                        {new Date(c.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>

                      {canManageComment(c) && editingCommentId !== c.id && (
                        <div
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                            className="text-gray-400 hover:text-gray-600 px-1"
                          >
                            ⋯
                          </button>

                          {openMenuId === c.id && (
                            <div className="absolute right-0 mt-1 w-28 bg-white border rounded shadow z-10">
                              <button
                                onClick={() => startEditComment(c)}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteComment(c.id)}
                                className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {editingCommentId === c.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          className="w-full border rounded p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                          rows={3}
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={cancelEditComment}
                            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEditComment(c.id)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 mt-1">{c.comment}</p>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Attachments ({attachments.length})</h2>

            {isMemberOrOwner && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-100 px-4 py-2 rounded mb-4"
                >
                  Upload File
                </button>
              </>
            )}

            {attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between border p-3 rounded mb-2">
                <p className="text-sm">{a.file_name}</p>
                <div className="flex gap-3">
                  <a href={`${BASE}${a.file_path}`} download className="text-blue-600 text-sm">Download</a>
                  {isMemberOrOwner && (
                    <button onClick={() => deleteAttachment(a.id)} className="text-red-500 text-sm">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
        <div className="space-y-4">
          <div className="bg-white shadow rounded-xl p-4">
            <h3 className="font-semibold mb-3">Details</h3>
            <p className="text-sm">Status: {STATUS_LABELS[task.task_status]}</p>
            <p className="text-sm">Priority: {PRIORITY_LABELS[task.priority]}</p>
            <p className="text-sm">Assigned To: {task.assignee?.username || "Unassigned"}</p>
            <p className="text-sm">Due: {task.due_date ? formatDate(task.due_date) : "—"}</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskDetail;