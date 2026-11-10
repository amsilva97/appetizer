"use client";

function PencilIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

interface ToolbarProps {
  editMode: boolean;
  onToggleEdit: () => void;
}

export default function Toolbar({ editMode, onToggleEdit }: ToolbarProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 h-12 bg-zinc-900/80 backdrop-blur-md border-b border-white/[0.06] flex items-center px-6">
      <div className="flex-1">
        <span className="text-zinc-100 font-semibold text-xl tracking-tight">appetizer</span>
      </div>

      <button
        onClick={onToggleEdit}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
          editMode
            ? "bg-zinc-100 text-zinc-900 shadow-lg"
            : "bg-white/10 text-zinc-300 border border-white/[0.08] hover:bg-white/[0.15] hover:text-zinc-100"
        }`}
      >
        <PencilIcon size={15} />
        Edit
      </button>
    </div>
  );
}
