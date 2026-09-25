import { createContext, useContext } from "react";

// Contexto da página de clube: os blocos "club_chart" e "number" (modo indicador) não buscam
// nada sozinhos — leem daqui o clube, as cores dele e as séries financeiras já carregadas
// (ver ClubModules.jsx). Fora de uma página de clube o valor é null.
export const ClubModuleContext = createContext(null);

export function useClubModule() {
  return useContext(ClubModuleContext);
}
