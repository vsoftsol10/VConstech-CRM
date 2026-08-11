export default function Toggle({ active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full p-1 flex items-center transition duration-200 ${
        active ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition duration-200 ${
          active ? "translate-x-6" : ""
        }`}
      />
    </button>
  );
}