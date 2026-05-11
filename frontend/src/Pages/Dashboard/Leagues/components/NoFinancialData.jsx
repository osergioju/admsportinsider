import { useTranslation } from "../../../../context/TranslationContext";

export default function NoFinancialData({ title }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {title && <p className="text-base font-semibold text-gray-500 mb-3">{title}</p>}
      <p className="font-semibold text-[#0A0A0A] text-lg">
        {t("finance.no_data_title", "Ah, não!")}
      </p>
      <p className="text-sm text-gray-400 max-w-xs mt-2">
        {t("finance.no_data_desc_league", "Esses dados não estão disponíveis no documento publicado pela liga.")}
      </p>
    </div>
  );
}
