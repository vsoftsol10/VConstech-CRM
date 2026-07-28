import { API_BASE_URL } from "../config/api";



import { useState, useEffect } from "react";
import axios from "axios";
import {
  TeamStats,
  TeamMemberTable,
  AddMemberForm,
  AssignTaskForm,
} from "../components/TeamMember";
import ViewMemberModal from "../components/TeamMember/ViewMemberModal";

const API = `${API_BASE_URL}`;

export default function TeamMembers() {
  const [members,  setMembers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [modal,    setModal]    = useState(null); // null | "add" | "edit" | "assign" | "view"
  const [selected, setSelected] = useState(null);

  // ── Fetch all members ───────────────────────────────────────────────────
  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/api/team`);
      setMembers(res.data);
    } catch (err) {
      console.error("GET /team error:", err.message);
      setError("Failed to load team members. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // ── Delete member ───────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this team member?")) return;
    try {
      await axios.delete(`${API}/api/team/${id}`);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("DELETE /team error:", err.message);
      alert("Failed to delete member.");
    }
  };

  const closeModal = () => { setModal(null); setSelected(null); };

  // ── Shared loading / error states ───────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm gap-2">
        <svg className="animate-spin" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        Loading team members…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-red-500 text-sm font-medium">{error}</p>
        <button
          onClick={fetchMembers}
          className="px-4 py-2 bg-yellow-400 text-black text-sm font-bold rounded-xl hover:bg-yellow-500 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-[22px] sm:text-[28px] md:text-[32px] font-bold text-[#111111]">
          Team Members
        </h1>
      </div>

      {/* Stats cards */}
      <TeamStats members={members} />

      {/* Table card */}
      <div className="space-y-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">

        {/* Action bar */}
        <div className="flex items-center justify-end flex-wrap gap-3">
          <button
            onClick={() => { setSelected(null); setModal("add"); }}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 font-semibold rounded-xl text-sm shadow-md shadow-yellow-200 transition-all hover:scale-[1.02] active:scale-95"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Member
          </button>

          <button
            onClick={() => setModal("assign")}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 font-semibold rounded-xl text-sm shadow-md shadow-yellow-200 transition-all hover:scale-[1.02] active:scale-95"

          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Assign Task
          </button>
        </div>

        {/* Table */}
        <TeamMemberTable
          members={members}
          onView={(m)  => { setSelected(m); setModal("view"); }}
          onEdit={(m)  => { setSelected(m); setModal("edit"); }}
          onDelete={handleDelete}
        />

      </div>

      {/* Modals */}
      {(modal === "add" || modal === "edit") && (
        <AddMemberForm
          key={modal + (selected?.id || "new")}
          initialData={selected}
          existingMembers={members}
          onClose={closeModal}
          onSave={() => {
            fetchMembers(); // re-fetch from DB after add/edit
            closeModal();
          }}
        />
      )}

    
{modal === "assign" && (
  <AssignTaskForm
    onClose={closeModal}
    onAssign={async () => {
      await fetchMembers(); // ← just refresh, don't post again
      closeModal();
    }}
    prefillAssignee={selected?.name}
  />
)}
{modal === "view" && selected && (
  <ViewMemberModal
    member={selected}
    onClose={closeModal}
    onEdit={(member) => {
      setSelected(member);
      setModal("edit");
    }}
  />
)}

    </div>
  );
}
