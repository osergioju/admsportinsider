import { useEffect, useState } from "react";
import { api } from "../services/api";

export function useBanners() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api.get("/admin/banners"); // depois troca p/ /public
      const now = new Date();

      const published = res.data.banners.filter((b) => {
        if (b.status !== "active" && b.status !== "scheduled") return false;

        const start = b.start_at ? new Date(b.start_at) : null;
        const end = b.end_at ? new Date(b.end_at) : null;

        if (start && now < start) return false;
        if (end && now > end) return false;

        return true;
      });

      setBanners(published);
    }

    load();
  }, []);

  return banners;
}
