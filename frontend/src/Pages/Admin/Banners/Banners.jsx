import { useEffect, useState } from "react";
import { api } from "../../../services/api";

export default function Banners() {
  // =========================
  // STATES
  // =========================
  const [banners, setBanners] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    image_desktop_url: "",
    image_mobile_url: "",
    link_url: "",
    start_at: "",
    end_at: "",
    status: "draft"
  });

  // =========================
  // LOAD BANNERS
  // =========================
  async function loadBanners() {
    try {
      const res = await api.get("/admin/banners");
      setBanners(res.data.banners);
    } catch (err) {
      console.error("Erro ao carregar banners", err);
    }
  }

  useEffect(() => {
    loadBanners();
  }, []);

  // =========================
  // UPLOAD IMAGE
  // =========================
  async function uploadImage(file, type) {
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post(
        "/admin/banners/upload-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setForm((prev) => ({
        ...prev,
        [type]: res.data.url
      }));

    } catch (err) {
      alert("Erro ao enviar imagem");
    }

    setUploading(false);
  }

  // =========================
  // OPEN MODALS
  // =========================
  function openCreate() {
    setIsEditing(false);
    setCurrentId(null);
    setForm({
      title: "",
      image_desktop_url: "",
      image_mobile_url: "",
      link_url: "",
      start_at: "",
      end_at: "",
      status: "draft"
    });
    setModalOpen(true);
  }

  function openEdit(banner) {
    setIsEditing(true);
    setCurrentId(banner.id_banner);
    setForm({
      ...banner,
      start_at: banner.start_at ? banner.start_at.slice(0, 16) : "",
      end_at: banner.end_at ? banner.end_at.slice(0, 16) : ""
    });
    setModalOpen(true);
  }

  // =========================
  // SAVE
  // =========================
  async function saveBanner() {
    try {
      if (isEditing) {
        await api.put(`/admin/banners/${currentId}`, form);
      } else {
        await api.post("/admin/banners", form);
      }

      await loadBanners();
      setModalOpen(false);

    } catch (err) {
      alert("Erro ao salvar banner");
    }
  }

  // =========================
  // DELETE
  // =========================
  async function deleteBanner(id) {
    if (!window.confirm("Deseja desativar este banner?")) return;

    try {
      await api.delete(`/admin/banners/${id}`);
      loadBanners();
    } catch (err) {
      alert("Erro ao remover banner");
    }
  }

  // =========================
  // HELPERS
  // =========================
    function getBannerDisplayStatus(banner) {
        const now = new Date();

        const start = banner.start_at ? new Date(banner.start_at) : null;
        const end = banner.end_at ? new Date(banner.end_at) : null;

        if (banner.status === "draft") {
            return "draft";
        }

        if (banner.status === "scheduled") {
            if (start && now < start) return "scheduled";
            if (start && (!end || now <= end)) return "published";
            if (end && now > end) return "expired";
        }

        if (banner.status === "active") {
            return "published";
        }

        return "draft";
    }

    function displayLabel(status) {
        if (status === "published") return "Publicado";
        if (status === "scheduled") return "Agendado";
        if (status === "expired") return "Expirado";
        return "Rascunho";
    }

    function displayColor(status) {
        if (status === "published") return "bg-green-100 text-green-700";
        if (status === "scheduled") return "bg-yellow-100 text-yellow-700";
        if (status === "expired") return "bg-red-100 text-red-700";
        return "bg-gray-200 text-gray-600";
    }
  

  // =========================
  // RENDER
  // =========================
  return (
    <div className="p-6 bg-white rounded-xl shadow">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Banners</h1>

        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Novo Banner
        </button>
      </div>

      {/* LIST */}
      <ul className="space-y-3">
        {banners.map((banner) => (
          <li
            key={banner.id_banner}
            className="cursor-pointer p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center"
            onClick={() => openEdit(banner)}
          >
            <div>
              <p className="font-semibold">{banner.title}</p>
              <p className="text-sm text-gray-500">
                {banner.start_at
                  ? `${banner.start_at} → ${banner.end_at || "—"}`
                  : "Sem agendamento"}
              </p>
            </div>

            <div className="flex gap-3 items-center">
              {(() => {
                const displayStatus = getBannerDisplayStatus(banner);

                return (
                    <span
                    className={`px-3 py-1 rounded-full text-sm ${displayColor(displayStatus)}`}
                    >
                    {displayLabel(displayStatus)}
                    </span>
                );
            })()}


              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBanner(banner.id_banner);
                }}
                className="text-red-600 text-sm underline"
              >
                Desativar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-2xl p-6 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {isEditing ? "Editar Banner" : "Novo Banner"}
            </h2>

            {/* TITLE */}
            <input
              className="w-full border px-3 py-2 rounded mb-3"
              placeholder="Título"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            {/* DESKTOP IMAGE */}
            <label className="block text-sm mb-1">Imagem Desktop</label>
            <input
              type="file"
              onChange={(e) =>
                uploadImage(e.target.files[0], "image_desktop_url")
              }
            />
            {form.image_desktop_url && (
              <img
                src={form.image_desktop_url}
                className="h-20 mt-2 rounded"
              />
            )}

            {/* MOBILE IMAGE */}
            <label className="block text-sm mt-3 mb-1">Imagem Mobile</label>
            <input
              type="file"
              onChange={(e) =>
                uploadImage(e.target.files[0], "image_mobile_url")
              }
            />
            {form.image_mobile_url && (
              <img
                src={form.image_mobile_url}
                className="h-20 mt-2 rounded"
              />
            )}

            {/* LINK */}
            <input
              className="w-full border px-3 py-2 rounded mt-3"
              placeholder="Link ao clicar"
              value={form.link_url}
              onChange={(e) =>
                setForm({ ...form, link_url: e.target.value })
              }
            />

            {/* DATES */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) =>
                  setForm({ ...form, start_at: e.target.value })
                }
              />
              <input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) =>
                  setForm({ ...form, end_at: e.target.value })
                }
              />
            </div>

            {/* STATUS */}
            <select
              className="w-full border px-3 py-2 rounded mt-3"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option value="draft">Rascunho</option>
              <option value="scheduled">Agendado</option>
              <option value="active">Ativo</option>
            </select>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-600"
              >
                Cancelar
              </button>

              <button
                onClick={saveBanner}
                disabled={uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {isEditing ? "Salvar" : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
