import React from "react";

export default function SubmitButtonMini({ text, children, ...props }) {
  return (
    <div className="mt-2">
      <button
        type="submit"
        className="cursor-pointer w-full py-4 lg:py-5 rounded-full bg-[linear-gradient(109.09deg,#FFFFFF_3.35%,#E7D3FF_96.65%)] hover:opacity-90 transition-all flex items-center justify-center gap-2 group"
        {...props}
      >
        {text && (
          <span className="text-[#7F33D9] text-lg cursor-pointer">
            {text}
          </span>
        )}
        {children}
      </button>
    </div>
  );
}