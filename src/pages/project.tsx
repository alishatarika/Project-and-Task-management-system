import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { authHeaders, clearAuth, getUser, isLoggedIn } from "../utils/auth";
import { toast } from "react-hot-toast";

type User = {
  id: number;
  username: string;
  email: string;
};

type Project = {
  id: number;
  name: string;
  description: string;
  status: boolean;
};

type Member = {
  id: number;
  project_id: number;
  user_id: number;
  status: boolean;
  user?: User;
};

const PROJECT_API = "http://localhost:8000/projects/";
const MEMBERS_API = "http://localhost:8000/project-members/";
const USERS_API = "http://localhost:8000/users/";

const ProjectPage: React.FC = () => {

  const navigate = useNavigate();
  const [user] = useState<User | null>(() => getUser<User>());

  const [projects,setProjects] = useState<Project[]>([]);
  const [members,setMembers] = useState<Member[]>([]);
  const [users,setUsers] = useState<User[]>([]);

  const [selectedProject,setSelectedProject] = useState<Project | null>(null);

  const [name,setName] = useState("");
  const [description,setDescription] = useState("");

  const [showModal,setShowModal] = useState(false);
  const [showMemberModal,setShowMemberModal] = useState(false);

  const [editingId,setEditingId] = useState<number | null>(null);

  const [selectedUser,setSelectedUser] = useState<number | "">("");

  const [currentPage,setCurrentPage] = useState(1);
  const projectsPerPage = 6;

  useEffect(()=>{

  if(!isLoggedIn()){
    navigate("/login");
    return;
  }

  fetchProjects();
  },[navigate]);

  const handle401 = ()=>{
    clearAuth();
    toast.error("Session expired. Please login again.");
    navigate("/login");
  };

  const fetchProjects = async()=>{

    try{

      const res = await axios.get(PROJECT_API,{
        headers:authHeaders()
      });

      setProjects(res.data);

    }catch(err:any){

      if(err?.response?.status === 401){
        handle401();
        return;
      }

      toast.error("Failed to fetch projects");

    }

  };

  const handleCreate = async()=>{

    if(!name.trim()){
      toast.error("Project name cannot be empty");
      return;
    }

    if(description.length > 500){
      toast.error("Description cannot exceed 500 characters");
      return;
    }

    try{

      const res = await axios.post(
        PROJECT_API,
        {
          name,
          description,
          owner_id:user?.id
        },
        {headers:authHeaders()}
      );

      setProjects(prev=>[res.data,...prev]);

      resetModal();

      toast.success("Project created");

    }catch(err:any){

      if(err?.response?.status === 401){
        handle401();
        return;
      }

      toast.error(err?.response?.data?.detail || "Create failed");

    }

  };

  const handleUpdate = async()=>{

    if(!editingId) return;

    try{

      const res = await axios.put(
        `${PROJECT_API}${editingId}/`,
        {name,description},
        {headers:authHeaders()}
      );

      setProjects(prev =>
        prev.map(p => p.id === editingId ? res.data : p)
      );

      resetModal();

      toast.success("Project updated");

    }catch(err:any){
      if(err?.response?.status === 401){
        handle401();
        return;
      }

      toast.error("Project with this name already exists or update failed");

    }

  };

  const handleDelete = async(id:number)=>{

    if(!confirm("Delete project?")) return;

    try{

      await axios.delete(`${PROJECT_API}${id}/`,{
        headers:authHeaders()
      });

      setProjects(prev=>prev.filter(p=>p.id!==id));

      toast.success("Project deleted");

    }catch(err:any){

      if(err?.response?.status === 401){
        handle401();
        return;
      }

      toast.error("Delete failed");

    }

  };

  const startEdit = (project:Project)=>{

    setEditingId(project.id);
    setName(project.name);
    setDescription(project.description);
    setShowModal(true);

  };

  const resetModal = ()=>{
    setShowModal(false);
    setEditingId(null);
    setName("");
    setDescription("");
  };

  const loadMembers = async(project:Project)=>{

    setSelectedProject(project);
    setShowMemberModal(true);

    try{

      const [mRes,uRes] = await Promise.all([
        axios.get(`${MEMBERS_API}project/${project.id}/`,{
          headers:authHeaders()
        }),
        axios.get(USERS_API,{
          headers:authHeaders()
        })
      ]);

      setMembers(mRes.data);
      setUsers(uRes.data);

    }catch(err:any){

      if(err?.response?.status === 401){
        handle401();
        return;
      }

      toast.error("Failed to load members");

    }

  };

  const handleAddMember = async()=>{

    if(selectedUser === "" || !selectedProject){
      toast.error("Select user");
      return;
    }

    try{

      const res = await axios.post(
        MEMBERS_API,
        {
          project_id:selectedProject.id,
          user_id:selectedUser
        },
        {headers:authHeaders()}
      );

      setMembers(prev=>[...prev,res.data]);
      setSelectedUser("");

      toast.success("Member added");

    }catch(err:any){

      toast.error("Add member failed");

    }

  };

  const handleRemoveMember = async(id:number)=>{

    if(!confirm("Remove member?")) return;

    try{

      await axios.delete(`${MEMBERS_API}${id}/`,{
        headers:authHeaders()
      });

      setMembers(prev=>prev.filter(m=>m.id!==id));

      toast.success("Member removed");

    }catch(err:any){

      toast.error("Remove member failed");

    }

  };

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject,indexOfLastProject);
  const totalPages = Math.ceil(projects.length / projectsPerPage);

  if(!user) return null;

  return (

    <div className="min-h-screen bg-gray-100 p-8">

      <h1 className="text-2xl font-bold mb-6">Projects</h1>

      <button
        onClick={()=>setShowModal(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-6"
      >
        Create Project
      </button>

      <div className="grid md:grid-cols-3 gap-4 mb-8">

        {currentProjects.map(project =>(

          <div key={project.id} className="bg-white p-4 rounded shadow">

            <h2
              onClick={()=>navigate(`/projects/${project.id}`)}
              className="font-semibold text-lg cursor-pointer text-blue-600"
            >
              {project.name}
            </h2>

            <p className="text-sm text-gray-500">
              {project.description}
            </p>

            <div className="flex gap-3 mt-3">

              <button
                onClick={()=>loadMembers(project)}
                className="text-indigo-600 text-sm"
              >
                Members
              </button>

              <button
                onClick={()=>startEdit(project)}
                className="text-blue-500 text-sm"
              >
                Edit
              </button>

              <button
                onClick={()=>handleDelete(project.id)}
                className="text-red-500 text-sm"
              >
                Delete
              </button>

            </div>

          </div>

        ))}

      </div>


      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

          <div className="bg-white p-6 rounded shadow w-96">

            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Edit Project" : "Create Project"}
            </h2>

            <input
              className="border p-2 w-full mb-3 rounded"
              placeholder="Project Name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />

            <textarea
              className="border p-2 w-full mb-1 rounded"
              placeholder="Description (max 500 characters)"
              value={description}
              maxLength={500}
              onChange={(e)=>setDescription(e.target.value)}
            />

            <p className="text-xs text-gray-500 text-right">
              {description.length}/500
            </p>

            <div className="flex justify-end gap-2 mt-3">

              <button
                onClick={resetModal}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>

              {editingId ? (

                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Update
                </button>

              ) : (

                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Create
                </button>

              )}

            </div>

          </div>

        </div>

      )}

      {showMemberModal && selectedProject && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

          <div className="bg-white p-6 rounded shadow w-96 max-h-[80vh] overflow-y-auto">

            <h2 className="text-lg font-semibold mb-4">
              Members - {selectedProject.name}
            </h2>

            <div className="flex gap-2 mb-4">

              <select
                className="border p-2 rounded flex-1"
                value={selectedUser}
                onChange={(e)=>
                  setSelectedUser(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              >

                <option value="">Select user</option>

                {users.map(u=>(
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}

              </select>

              <button
                onClick={handleAddMember}
                className="bg-blue-500 text-white px-3 rounded"
              >
                Add
              </button>

            </div>

            <ul className="space-y-2 mb-4">

              {members.map(member=>(

                <li
                  key={member.id}
                  className="flex justify-between border p-2 rounded"
                >

                  <span>
                    {member.user?.username || `User ${member.user_id}`}
                  </span>

                  <button
                    onClick={()=>handleRemoveMember(member.id)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>

                </li>

              ))}

            </ul>

            <div className="flex justify-end">

              <button
                onClick={()=>setShowMemberModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      <div className="flex justify-center items-center gap-4 mt-6">

        <button
          disabled={currentPage === 1}
          onClick={()=>setCurrentPage(prev=>prev-1)}
          className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="font-semibold">
          Page {currentPage} of {totalPages}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={()=>setCurrentPage(prev=>prev+1)}
          className="bg-gray-300 px-3 py-1 rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </div>

  );

};

export default ProjectPage;