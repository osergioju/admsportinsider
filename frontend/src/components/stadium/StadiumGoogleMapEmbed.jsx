// Comparativo rápido pra aprovação de cliente — NÃO é a experiência final.
// Usa o mesmo formato de URL do botão "Compartilhar → Incorporar um mapa" do
// próprio Google Maps (sem API key, sem Cloud Console, sem faturamento) —
// mas por isso também não aceita estilo customizado nem controle por JS: sem
// roxo, sem animação cinematográfica, sem marker/card próprios. O "3D"
// inclinado do app novo do Google não tem parâmetro de URL documentado nesse
// embed legado — o que dá pra garantir de verdade é satélite/híbrido (t=h),
// que em zoom alto e cidades com cobertura o próprio Google já renderiza com
// relevo de prédio automaticamente.
export default function StadiumGoogleMapEmbed({ latitude, longitude, stadiumName, mapType = "roadmap", className = "" }) {
    const zoom = mapType === "satellite" ? 16 : 15;
    const typeParam = mapType === "satellite" ? "&t=h" : "";
    const src = `https://www.google.com/maps?q=${latitude},${longitude}&z=${zoom}${typeParam}&output=embed`;

    return (
        <div className={className}>
            <iframe
                title={stadiumName || "Mapa do estádio"}
                src={src}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
            />
        </div>
    );
}
