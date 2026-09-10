export default function TextBlock({ slot }) {
  const { title, body_html } = slot.content || {};
  return (
    <div className="w-full h-full bg-white border border-gray-100 rounded-2xl p-6">
      {title && <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>}
      {body_html && (
        <div
          className="legal-content text-[#0A0A0AB2] text-sm leading-relaxed space-y-3"
          dangerouslySetInnerHTML={{ __html: body_html }}
        />
      )}
    </div>
  );
}
