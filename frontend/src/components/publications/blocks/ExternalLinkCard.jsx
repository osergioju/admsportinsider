import PublicationCard from "./PublicationCard";

export default function ExternalLinkCard({ slot }) {
  const { url, title, image_url, source_label } = slot.content || {};
  if (!url) return null;

  return <PublicationCard title={title} link={url} image={image_url} ctaLabel={source_label ? `Ver em ${source_label}` : "Ver conteúdo"} />;
}
