// hooks/useFavorites.js
import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

/**
 * Hook global de favoritos.
 * Carrega todos os favoritos do usuário e expõe:
 *  - isFavorited(id, type) → boolean
 *  - toggleFavorite(id, type) → Promise
 *  - favorites → array bruto
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carrega favoritos ao montar
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/favorites/all");
        setFavorites(data.data || []);
      } catch (err) {
        console.error("Erro ao carregar favoritos:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  /**
   * Verifica se um item está favoritado
   */
  const isFavorited = useCallback(
    (entityId, entityType) =>
      favorites.some(
        (f) =>
          f.entity_id === entityId && f.entity_type === entityType
      ),
    [favorites]
  );

  /**
   * Toggle favorito — atualiza estado local otimisticamente
   * e sincroniza com a API
   */
  const toggleFavorite = useCallback(
    async (entityId, entityType) => {
      const alreadyFavorited = favorites.some(
        (f) => f.entity_id === entityId && f.entity_type === entityType
      );

      // Atualização otimista
      if (alreadyFavorited) {
        setFavorites((prev) =>
          prev.filter(
            (f) =>
              !(f.entity_id === entityId && f.entity_type === entityType)
          )
        );
      } else {
        setFavorites((prev) => [
          ...prev,
          { entity_id: entityId, entity_type: entityType },
        ]);
      }

      // Sincroniza com API
      try {
        await api.post("/favorites/toggle", {
          entity_id: entityId,
          entity_type: entityType,
        });
      } catch (err) {
        console.error("Erro ao favoritar:", err);

        // Reverte em caso de erro
        if (alreadyFavorited) {
          setFavorites((prev) => [
            ...prev,
            { entity_id: entityId, entity_type: entityType },
          ]);
        } else {
          setFavorites((prev) =>
            prev.filter(
              (f) =>
                !(f.entity_id === entityId && f.entity_type === entityType)
            )
          );
        }
      }
    },
    [favorites]
  );

  return { favorites, loading, isFavorited, toggleFavorite };
}