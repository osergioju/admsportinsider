import React from "react";

export default function SubmitButton({ text, children, loading, ...props }) {
  return (
    <div className="mt-2">
      <button
        type="submit"
        disabled={loading}
        className={`
          relative overflow-hidden
          cursor-pointer w-full py-4 lg:py-6 rounded-full
          flex items-center justify-center gap-3 group
          transition-all duration-300
          
          bg-[linear-gradient(109.09deg,#FFFFFF_3.35%,#E7D3FF_96.65%)]
          hover:scale-[1.02] active:scale-[0.98]
          
          ${loading ? "opacity-80 cursor-not-allowed" : "hover:shadow-[0_0_25px_rgba(127,51,217,0.4)]"}
        `}
        {...props}
      >

        {/* Glow animado */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-purple-400/20 blur-xl"></div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex items-center gap-2">
            {/* spinner */}
            <div className="w-5 h-5 border-2 border-[#7F33D9] border-t-transparent rounded-full animate-spin"></div>

            <span className="text-[#7F33D9] font-light lg:text-xl text-lg">
              Entrando...
            </span>
          </div>
        ) : (
          <>
            {text && (
              <span className="text-[#7F33D9] font-light lg:text-xl text-lg">
                {text}
              </span>
            )}

            {children}
          </>
        )}
      </button>
    </div>
  );
}