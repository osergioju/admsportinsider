import { useTranslation } from "../../context/TranslationContext";

export default function MeuDashboard() {
    const { t } = useTranslation();
    return (
        <div>
                {t("dashboard.greeting", "Olá")}
        </div>
    )
}