import React from "react";
import { Link } from "react-router-dom";

export default function LinkButton({ text, children, to, ...props }) {
  return (
    <div className="mt-2">
      <Link to={to}
        type="submit"
        className="text-center bg-gradient-to-r from-[#904EDE] to-[#4E2A78] gap-4 mr-0 px-5 flex items-center py-3 border border-[#A572E1] text-[#ffffff] rounded-full hover:brightness-110 transition-all"
        {...props}
      >
        {text && (
          <span className="text-center w-full text-white text-lg cursor-pointer">
            {text}
          </span>
        )}
        {children}
      </Link>
    </div>
  );
}