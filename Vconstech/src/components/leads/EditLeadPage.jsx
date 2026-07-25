import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import AddLeadModal from "../leads/AddleadForm";

export default function EditLeadPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `http://localhost:5000/api/leads/${id}`
        );

        setLead(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (!lead) return <p>No lead found</p>;
  if (lead.status?.toLowerCase() === "won" && lead.is_customer) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 max-w-md text-center">
          <h2 className="text-lg font-bold text-[#111111] mb-2">Lead is read-only</h2>
          <p className="text-sm text-gray-500 mb-5">
            This lead has already been converted to a customer and cannot be edited.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl bg-[#F5C518] text-black text-sm font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <AddLeadModal
      editData={lead}
      onClose={() => navigate(-1)}
    />
  );
}
