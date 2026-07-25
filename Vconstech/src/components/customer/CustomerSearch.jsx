import { Search } from "lucide-react";

export default function CustomerSearchBar({
  tableSearch,
  setTableSearch,
}) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

      <input
        type="text"
        placeholder="Search by name, email, phone..."
        value={tableSearch}
        onChange={(e) =>
          setTableSearch(e.target.value)
        }
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm outline-none focus:border-yellow-400"
      />
    </div>
  );
}