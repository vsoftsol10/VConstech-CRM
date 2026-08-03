import { AlertCircle, CheckCircle } from "lucide-react";

const MessagePanel = ({ type = "error", title, message }) => {
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  const tone = type === "success" ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-900";
  const iconTone = type === "success" ? "bg-green-500" : "bg-red-500";

  if (type === "success") {
    return (
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white/95 p-8 shadow-xl shadow-emerald-100/80">
        <div className="flex flex-col items-center gap-7 sm:flex-row">
          <div className="relative flex min-h-32 w-full items-center justify-center sm:w-52">
            <span className="absolute left-8 top-6 h-2 w-2 rounded-full bg-emerald-500" />
            <span className="absolute right-8 top-4 h-2 w-2 rounded-full bg-emerald-500" />
            <span className="absolute bottom-6 left-6 h-2 w-2 rounded-full bg-emerald-500" />
            <span className="absolute bottom-8 right-10 h-2 w-2 rounded-full bg-emerald-500" />
            <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center">
              <Icon className="w-14 h-14 text-emerald-500" />
            </div>
          </div>
          <div className="hidden h-36 w-px bg-gray-200 sm:block" />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-gray-950">{title}</h1>
            <p className="mt-5 max-w-md text-xl leading-8 text-gray-500">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl rounded-3xl border ${tone} p-6 sm:p-8 shadow-xl`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-2xl ${iconTone} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm sm:text-base leading-6">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default MessagePanel;

