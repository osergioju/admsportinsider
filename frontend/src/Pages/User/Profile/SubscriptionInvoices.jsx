import { useContext, useEffect } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { api } from "../../../services/api";
import { useNavigate } from "react-router-dom";

export default function SubscriptionInvoices() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // BLOQUEIA FREE USER
    const isPaid =
      user?.stripe_subscription_id &&
      ["active", "trialing"].includes(user.subscription_status);

    if (!isPaid) {
      navigate("/me/profile");
      return;
    }

    async function redirectToPortal() {
      try {
        const response = await api.post("/stripe/billing/portal");
        window.location.href = response.data.url;
      } catch (err) {
        console.error("Error redirecting to billing portal", err);
        navigate("/me/profile");
      }
    }

    redirectToPortal();
  }, [user, navigate]);

  return (
    <p className="text-sm text-gray-500">
      Redirecting to billing portal...
    </p>
  );
}
