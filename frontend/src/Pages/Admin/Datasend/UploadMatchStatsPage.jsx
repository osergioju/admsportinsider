import { useState, useEffect } from "react";
import { api } from "../../../services/api";
import BaseUploadLayout from "./BaseUploadLayout";

export default function UploadMatchStatsPage() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("upload");
  const [analysis, setAnalysis] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [competitions, setCompetitions] = useState([]);
  const [competitionId, setCompetitionId] = useState("");
  const [seasonYear, setSeasonYear] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (step !== "mapping") return;

    async function loadCompetitions() {
      const { data } = await api.get("/admin/competitions");
      setCompetitions(data.competitions);
    }

    loadCompetitions();
  }, [step]);

  async function handleUpload() {
    if (!file) return alert("Selecione um arquivo XLSX");

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post(
        "/upload/xlsx/analyze",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setAnalysis(data);
      setStep("mapping");
    } catch {
      alert("Erro ao analisar arquivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleImport() {
    setImporting(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sheetName", selectedSheet);
    formData.append("competitionId", competitionId);
    formData.append("seasonYear", seasonYear);

    try {
      await api.post("/xlsx/import-match-stats", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Importação concluída!");
      setStep("upload");
      setFile(null);
      setAnalysis(null);
    } catch {
      alert("Erro na importação");
    } finally {
      setImporting(false);
    }
  }

  return (
    <BaseUploadLayout
      title="Importação de Partidas"
      subtitle="Suba a planilha com dados detalhados das partidas."
      {...{
        file,
        setFile,
        step,
        uploading,
        importing,
        handleUpload,
        handleImport,
        analysis,
        selectedSheet,
        setSelectedSheet,
        competitions,
        competitionId,
        setCompetitionId,
        seasonYear,
        setSeasonYear
      }}
    />
  );
}