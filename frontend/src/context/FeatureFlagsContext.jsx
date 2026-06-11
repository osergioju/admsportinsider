import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { api } from "../services/api";
import { AuthContext } from "./AuthContext";

// Flags da "Manutenção do Sistema" (admin > Modo Manutenção > Sistema).
// Chave ausente = ativa. Subitem ("a.b") herda desativação do pai ("a").
const FeatureFlagsContext = createContext({ flags: {}, ready: false, isEnabled: () => true });

export function FeatureFlagsProvider({ children }) {
  const [flags, setFlags] = useState({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.get("/public/system-features")
      .then(({ data }) => setFlags(data.features || {}))
      .catch(() => setFlags({})) // em erro, nada é bloqueado
      .finally(() => setReady(true));
  }, []);

  const isEnabled = (key) => {
    if (!key) return true;
    if (flags[key] === false) return false;
    const parent = key.includes(".") ? key.split(".")[0] : null;
    if (parent && flags[parent] === false) return false;
    return true;
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, ready, isEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

// Guard de rota: bloqueia acesso direto por URL quando a funcionalidade
// está desativada. Espera as flags carregarem para não redirecionar à toa.
export function FeatureRoute({ featureKey }) {
  const { ready, isEnabled } = useFeatureFlags();
  const { user } = useContext(AuthContext);
  if (!ready) return null;
  if (!isEnabled(featureKey)) {
    return <Navigate to={user ? "/dashboard" : "/dashboard-public"} replace />;
  }
  return <Outlet />;
}
