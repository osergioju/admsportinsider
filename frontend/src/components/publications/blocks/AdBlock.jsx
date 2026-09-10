export default function AdBlock({ slot }) {
  if (!slot.banner_id) return null;

  const content = (
    <>
      <img src={slot.image_desktop_url} alt="" className="hidden md:block w-full h-full object-cover" />
      <img src={slot.image_mobile_url} alt="" className="block md:hidden w-full h-full object-cover" />
    </>
  );

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden relative">
      {slot.link_url ? (
        <a href={slot.link_url} target="_blank" rel="noopener noreferrer" aria-label={slot.banner_title || "Publicidade"}>
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
