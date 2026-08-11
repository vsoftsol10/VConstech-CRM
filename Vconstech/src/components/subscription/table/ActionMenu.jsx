import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import SendReminderModal from "../modal/SendReminderModal";
import { BellIcon } from "../icons/SubscriptionIcons";

export default function ActionMenu({ row, onReminderSent }) {
  const [modalRow, setModalRow] = useState(null);

  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setModalRow(row)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:border-yellow-300 hover:bg-[#FFFBF0] hover:text-[#C89B00] active:scale-95"
          aria-label="Notify customer"
          title="Notify customer"
        >
          <BellIcon />
        </button>
      </div>

      <AnimatePresence>
        {modalRow && (
          <SendReminderModal
            row={modalRow}
            onClose={() => setModalRow(null)}
            onReminderSent={(updatedRow) => {
              setModalRow(null);
              onReminderSent?.(updatedRow);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
