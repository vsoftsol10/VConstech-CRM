import { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .toast-enter    { animation: toastIn 0.3s cubic-bezier(.4,0,.2,1) forwards; }
        .toast-progress { animation: toastProgress 3.5s linear forwards; }
      `}</style>
      <div className="fixed bottom-6 right-4 left-4 sm:left-auto sm:right-6 z-[9999] toast-enter">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
          <div className="toast-progress absolute bottom-0 left-0 h-1 bg-green-400 rounded-full" />
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-semibold text-gray-800 flex-1">{message}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Toast;
