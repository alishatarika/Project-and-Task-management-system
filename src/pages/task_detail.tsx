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
const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-600",
  review: "bg-yellow-100 text-yellow-600",
  done: "bg-green-100 text-green-600",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-600",
  medium: "bg-yellow-100 text-yellow-600",
  high: "bg-red-100 text-red-600",
  critical: "bg-purple-100 text-purple-600",
};

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext!)) return "🖼️";
  if (ext === "pdf") return "📄";
  if (["doc","docx"].includes(ext!)) return "📝";
  if (["xls","xlsx","csv"].includes(ext!)) return "📊";
  if (["zip","rar","7z"].includes(ext!)) return "🗜️";
  return "📎";
};

const isPreviewable = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg|pdf)$/i.test(name);

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

  // Edit form
  const [editingTask, setEditingTask] = useState(false);
  const [title,       setTitle]       = useState("");
  const [desc,        setDesc]        = useState("");
  const [assignee,    setAssignee]    = useState("");
  const [dueDate,     setDueDate]     = useState("");
  const [taskStatus,  setTaskStatus]  = useState("todo");
  const [priority,    setPriority]    = useState("medium");

  // Comments
  const [commentText, setCommentText] = useState("");

  // Attachments
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver,       setDragOver]       = useState(false);
  const [previewUrl,     setPreviewUrl]     = useState<string | null>(null);
  const [previewName,    setPreviewName]    = useState("");
  

  const [showModal,setShowModal] = useState(false);
  const [showMemberModal,setShowMemberModal] = useState(false);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const isOverdue = (d: string) =>
    d && d.slice(0, 10) < todayStr && task?.task_status !== "done";

  useEffect(() => {
    if (!isLoggedIn()) { navigate("/login"); return; }
    loadData();
  }, [id]);

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

  // ── Save task edit ─────────────────────────────────────────────
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

  const startEdit = () => {
    setTitle(task.title);
    setDesc(task.description || "");
    setAssignee(task.assigned_to || "");
    setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
    setTaskStatus(task.task_status || "todo");
    setPriority(task.priority || "medium");
    setEditingTask(true);
  };

  // ── Comments ───────────────────────────────────────────────────
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

  const deleteComment = async (commentId: number) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await axios.delete(`${BASE}/task-comments/${commentId}`, { headers: authHeaders() });
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success("Comment deleted");
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  // ── File upload ────────────────────────────────────────────────
  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("File exceeds 10 MB"); return; }
    setUploading(true); setUploadProgress(0);
    const form = new FormData();
    form.append("task_id", String(id));
    form.append("file", file);
    try {
      const token = authHeaders().Authorization;
      const res = await axios.post(`${BASE}/task-attachments/upload`, form, {
        headers: { Authorization: token },
        onUploadProgress: e => setUploadProgress(e.total ? Math.round(e.loaded * 100 / e.total) : 0),
      });
      setAttachments(prev => [...prev, res.data]);
      toast.success(`"${file.name}" uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteAttachment = async (attachId: number) => {
    if (!window.confirm("Remove this attachment?")) return;
    try {
      await axios.delete(`${BASE}/task-attachments/${attachId}`, { headers: authHeaders() });
      setAttachments(prev => prev.filter(a => a.id !== attachId));
      toast.success("Attachment removed");
    } catch {
      toast.error("Failed to remove attachment");
    }
  };

  if (loading)
    return <div className="flex justify-center items-center h-screen text-gray-500">Loading Task...</div>;

  if (!task)
    return <div className="text-center mt-20 text-gray-500">Task not found</div>;

 return (
  <div className="max-w-6xl mx-auto p-6">

   <div className="flex justify-between items-center mb-4">

  <Link
    to={`/projects/${task.project_id}`}
    className="text-blue-600 text-sm"
  >
    ← {project?.name || "Back to Project"}
  </Link>

  <button
    onClick={startEdit}
    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
  >
    Edit Task
  </button>

</div>

    {/* Edit Task Modal */}
    {editingTask && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">

        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

          <h2 className="text-lg font-semibold mb-4">
            Edit Task
          </h2>

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
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ) : null;
              })}
            </select>

            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="text-xs text-gray-500">Status</label>
                <select
                  className="border p-2 rounded w-full"
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                >
                  {TASK_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500">Priority</label>
                <select
                  className="border p-2 rounded w-full"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
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

            <button
              onClick={() => setEditingTask(false)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>

            <button
              onClick={saveTask}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Update Task
            </button>

          </div>

        </div>

      </div>
    )}

    <div className="grid md:grid-cols-3 gap-6">

      {/* Left Section */}
      <div className="md:col-span-2 space-y-6">

        {/* Comments */}
        <div className="bg-white shadow rounded-xl p-6">

          <h2 className="font-semibold text-lg mb-4">
            Comments ({comments.length})
          </h2>

          <div className="space-y-3 mb-4">

            {comments.length === 0 && (
              <p className="text-gray-400 text-sm">
                No comments yet.
              </p>
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
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-red-400 text-xs"
                  >
                    Delete
                  </button>

                </div>

                <p className="text-sm text-gray-700 mt-1">
                  {c.comment}
                </p>

              </div>
            ))}

          </div>

          <div className="flex gap-2">

            <input
              className="border p-2 rounded flex-1"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addComment();
              }}
            />

            <button
              onClick={addComment}
              className="bg-blue-500 text-white px-4 rounded"
            >
              Post
            </button>

          </div>

        </div>

        {/* Attachments */}
        <div className="bg-white shadow rounded-xl p-6">

          <h2 className="font-semibold text-lg mb-4">
            Attachments ({attachments.length})
          </h2>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-100 px-4 py-2 rounded mb-4"
          >
            Upload File
          </button>

          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between border p-3 rounded mb-2"
            >

              <p className="text-sm">{a.file_name}</p>

              <div className="flex gap-3">

                <a
                  href={`${BASE}${a.file_path}`}
                  download
                  className="text-blue-600"
                >
                  Download
                </a>

                <button
                  onClick={() => deleteAttachment(a.id)}
                  className="text-red-500"
                >
                  Remove
                </button>

              </div>

            </div>
          ))}

        </div>

      </div>

      {/* Sidebar */}
      <div className="space-y-4">

        <div className="bg-white shadow rounded-xl p-4">

          <h3 className="font-semibold mb-3">
            Details
          </h3>

          <p className="text-sm">
            Status: {STATUS_LABELS[task.task_status]}
          </p>

          <p className="text-sm">
            Priority: {PRIORITY_LABELS[task.priority]}
          </p>

          <p className="text-sm">
            Assigned To: {task.assignee?.username || "Unassigned"}
          </p>

          <p className="text-sm">
            Due: {task.due_date ? formatDate(task.due_date) : "—"}
          </p>

        </div>

      </div>

    </div>

  </div>
);
}
export default TaskDetail;