import { useState } from "react";
import { FiX, FiTrash2, FiPlus } from "react-icons/fi";

const EditPlanModal = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    price: plan?.price || "",
    duration: plan?.duration || "",
    description: plan?.description || "",
  });

const [features, setFeatures] = useState(
  plan?.features?.map((f) => f.feature_name) || []
);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addFeature = () => {
    setFeatures([...features, ""]);
  };

  const updateFeature = (index, value) => {
    const updated = [...features];
    updated[index] = value;
    setFeatures(updated);
  };

  const removeFeature = (index) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      features,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-xl font-bold">
            Edit {formData.name} Plan
          </h2>

          <button onClick={onClose}>
            <FiX size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Name */}
          <div>
            <label className="block mb-2 font-medium">
              Plan Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3"
            />
          </div>

          {/* Price + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-medium">
                Price
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-2 font-medium">
              Description
            </label>

            <textarea
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 resize-none"
            />
          </div>

          {/* Features */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="font-medium text-lg">
                Features
              </label>

              <button
                onClick={addFeature}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 px-3 py-2 rounded-lg font-medium"
              >
                <FiPlus />
                Add Feature
              </button>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) =>
                      updateFeature(index, e.target.value)
                    }
                    className="flex-1 border rounded-lg px-4 py-3"
                    placeholder="Enter feature"
                  />

                  <button
                    onClick={() => removeFeature(index)}
                    className="text-red-500 hover:bg-red-50 p-3 rounded-lg"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="bg-yellow-400 hover:bg-yellow-500 px-6 py-2 rounded-lg font-semibold"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
};

export default EditPlanModal;