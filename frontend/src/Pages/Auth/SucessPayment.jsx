import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const sessionId = params.get("session_id");

  useEffect(() => {
    // fallback de segurança
    if (!sessionId) {
      navigate("/me/subscription");
      return;
    }

    const timer = setTimeout(() => {
      navigate("/me/subscription/invoices");
    }, 4000); // 4 segundos

    return () => clearTimeout(timer);
  }, [sessionId, navigate]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-medium">
          Payment successful 🎉
        </h1>

        <p className="text-sm text-gray-600">
          Your subscription has been activated successfully.
        </p>

        <p className="text-sm text-gray-500">
          You will be redirected to your billing details shortly.
        </p>

        <div className="pt-4">
          <span className="inline-block text-xs text-gray-400">
            Processing subscription…
          </span>
        </div>
      </div>
    </div>
  );
}
