import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { clearAuth, isLoggedIn, getUser, authHeaders } from "../utils/auth";
import { toast } from "react-hot-toast";

const BASE = "http://localhost:8000";
const todayStr = new Date().toISOString().split("T")[0];

const TASK_STATUS_OPTIONS = ["todo", "in_progress", "review", "done"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
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

const ProjectDetail = () => {

  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser: any = getUser();

  const [project, setProject] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [editingTask, setEditingTask] = useState<number | null>(null);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const isOverdue = (d: string, status: string) =>
    d && d.slice(0, 10) < todayStr && status !== "done";

  const isMemberOrOwner = project?.owner_id === currentUser?.id ||
    members.some((m: any) => m.user_id === currentUser?.id);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {

      const [projectRes, memberRes, userRes, taskRes] = await Promise.all([
        axios.get(`${BASE}/projects/${id}`, { headers: authHeaders() }),
        axios.get(`${BASE}/project-members/project/${id}`, { headers: authHeaders() }),
        axios.get(`${BASE}/users/`, { headers: authHeaders() }),
        axios.get(`${BASE}/tasks/`, { headers: authHeaders() }),
      ]);

      setProject(projectRes.data);
      setMembers(memberRes.data);
      setUsers(userRes.data);
      setTasks(taskRes.data.filter((t: any) => t.project_id == id));

    } catch (error: any) {

      if (error.response?.status === 401 || error.response?.status === 403) {
        clearAuth();
        toast.error("Session expired");
        navigate("/login");
        return;
      }

      toast.error("Failed to load project");

    } finally {
      setLoading(false);
    }
  };

  const validateDate = (date: string) => {
    if (!date) return true;
    if (date < todayStr) {
      toast.error("Due date cannot be in the past");
      return false;
    }
    return true;
  };

  const saveTask = async () => {

    if (!title.trim()) {
      toast.error("Task title required");
      return;
    }

    if (!validateDate(dueDate)) return;

    try {

      if (editingTask) {

        const res = await axios.put(
          `${BASE}/tasks/${editingTask}`,
          {
            title,
            description: desc,
            assigned_to: assignee || null,
            due_date: dueDate || null,
            task_status: taskStatus,
            priority,
          },
          { headers: authHeaders() }
        );

        setTasks(tasks.map(t => (t.id === editingTask ? res.data : t)));
        toast.success("Task updated");

      } else {

        const res = await axios.post(
          `${BASE}/tasks/`,
          {
            title,
            description: desc,
            project_id: id,
            created_by: currentUser?.id,
            assigned_to: assignee || null,
            due_date: dueDate || null,
            task_status: taskStatus,
            priority,
          },
          { headers: authHeaders() }
        );

        setTasks([...tasks, res.data]);
        toast.success("Task created");
      }

      resetForm();

    } catch {
      toast.error("Failed to save task");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setAssignee("");
    setDueDate("");
    setTaskStatus("todo");
    setPriority("medium");
    setEditingTask(null);
    setShowTaskModal(false);
  };

  const editTask = (task: any) => {
    setEditingTask(task.id);
    setTitle(task.title);
    setDesc(task.description || "");
    setAssignee(task.assigned_to || "");
    setDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
    setTaskStatus(task.task_status || "todo");
    setPriority(task.priority || "medium");
    setShowTaskModal(true);
  };

  const deleteTask = (taskId: number) => {

    toast((t) => (
      <div>
        <p className="mb-2 font-medium">Delete this task?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await axios.delete(`${BASE}/tasks/${taskId}`, { headers: authHeaders() });
                setTasks(tasks.filter(t => t.id !== taskId));
                toast.success("Task deleted");
              } catch {
                toast.error("Delete failed");
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

  const getUsername = (uid: number) =>
    users.find(u => u.id === uid)?.username ?? "User";

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading Project...
      </div>
    );

  if (!project)
    return <div className="text-center mt-20 text-gray-500">Project not found</div>;

  return (

    <div className="max-w-6xl mx-auto p-6">

      <button
        onClick={() => navigate("/projects")}
        className="text-blue-600 mb-4"
      >
        ← Back to Projects
      </button>

      <div className="bg-white shadow rounded-xl p-6 mb-6">

        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-gray-500 mt-1">{project.description}</p>

      </div>

      {isMemberOrOwner && (
        <button
          onClick={() => setShowTaskModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
        >
          Create Task
        </button>
      )}

      <h2 className="text-xl font-semibold mb-4">
        Tasks ({tasks.length})
      </h2>

      <div className="space-y-4">

        {tasks.map(task => {

          const overdue = isOverdue(task.due_date, task.task_status);

          return (

            <div key={task.id} className="bg-white shadow rounded-xl p-4">

              <div className="flex justify-between">

                <div>

                  <h3 className="font-semibold">{task.title}</h3>

                  {task.description && (
                    <p className="text-gray-500 text-sm">
                      {task.description}
                    </p>
                  )}

                  <div className="flex gap-2 mt-2 flex-wrap">

                    <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[task.task_status]}`}>
                      {STATUS_LABELS[task.task_status]}
                    </span>

                    <span className={`text-xs px-2 py-1 rounded ${PRIORITY_COLORS[task.priority]}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>

                    {task.assigned_to && (
                      <span className="text-xs text-gray-500">
                        👤 {getUsername(task.assigned_to)}
                      </span>
                    )}

                    {task.due_date && (
                      <span className={`text-xs ${overdue ? "text-red-500" : "text-gray-400"}`}>
                        {overdue ? "⚠ " : "📅 "}
                        {formatDate(task.due_date)}
                      </span>
                    )}

                  </div>

                </div>

                <div className="flex gap-3 text-sm">

                  <Link
                    to={`/tasks/${task.id}`}
                    className="text-blue-600"
                  >
                    Open
                  </Link>

                  {isMemberOrOwner && (
                    <button
                      onClick={() => editTask(task)}
                      className="text-blue-600"
                    >
                      Edit
                    </button>
                  )}

                  {isMemberOrOwner && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  )}

                </div>

              </div>

            </div>

          );
        })}

      </div>

      {showTaskModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

          <div className="bg-white p-6 rounded-xl shadow w-[500px]">

            <h2 className="text-lg font-semibold mb-4">
              {editingTask ? "Edit Task" : "Create Task"}
            </h2>

            <div className="space-y-3">

              <input
                className="border p-2 rounded w-full"
                placeholder="Task title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />

              <textarea
                className="border p-2 rounded w-full"
                placeholder="Description"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />

              <select
                className="border p-2 rounded w-full"
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
              >

                <option value="">Assign Member</option>

                {members.map(m => {
                  const user = users.find(u => u.id === m.user_id);
                  if (!user) return null;
                  return (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  );
                })}

              </select>

              <div className="grid grid-cols-2 gap-3">

                <select
                  className="border p-2 rounded"
                  value={taskStatus}
                  onChange={e => setTaskStatus(e.target.value)}
                >
                  <option value="">Task Status</option>
                  {TASK_STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>

                <select
                  className="border p-2 rounded"
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                ><option value="">Task Priority</option>
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>

              </div>

             <input
      type="text"
       placeholder="Due Date"
       className="border p-2 rounded w-full"
      onFocus={(e) => (e.target.type = "date")}
        onBlur={(e) => {
    if (!e.target.value) e.target.type = "text";
       }}
      value={dueDate}
     onChange={(e) => setDueDate(e.target.value)}
     />

            </div>

            <div className="flex justify-end gap-3 mt-5">

              <button
                onClick={resetForm}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={saveTask}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                {editingTask ? "Update Task" : "Create Task"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default ProjectDetail;