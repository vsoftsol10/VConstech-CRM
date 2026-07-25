// components/department/MemberCard.jsx

const MemberCard = ({ name, role, stats }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
    {/* Avatar + name */}
    <div className="flex items-center gap-3 mb-3">
      <img
        src={`https://i.pravatar.cc/100?u=${name}`}
        alt={name}
        className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100"
      />
      <div>
        <p className="text-sm font-semibold text-gray-800 leading-tight">{name}</p>
        <p className="text-xs text-gray-400">{role}</p>
      </div>
    </div>

    {/* Stats row */}
    <div className="flex items-end gap-4 flex-wrap">
      {stats.map((s, i) => (
        <div key={i}>
          <p className="text-[11px] text-gray-400 mb-0.5">{s.label}</p>
          {s.isPerf ? (
            <span className="text-xs font-semibold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
              {s.value}
            </span>
          ) : (
            <p className="text-sm font-bold text-gray-800">{s.value}</p>
          )}
        </div>
      ))}
    </div>
  </div>
);

export default MemberCard;
