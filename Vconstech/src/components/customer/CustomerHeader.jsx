export default function CustomerHeader({ onExport }) {
  return (
    <div className="anim-fadeUp flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
    
 <div>
        <h1 className="text-[32px] font-bold text-[#111111]">
          Customer
        </h1>

      </div>
      <button
        type="button"
        onClick={onExport}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600 transition-colors w-fit"
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M12 16v-8m0 8l-3-3m3 3l3-3M3 21h18" />
        </svg>

        Export
      </button>
    </div>
  );
}
