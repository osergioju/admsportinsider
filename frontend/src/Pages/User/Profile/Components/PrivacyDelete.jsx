export default function PrivacyDelete() {
  return (
    <div>
      <h1 className="text-xl font-medium text-red-600 mb-4">
        Deletar conta
      </h1>

      <p className="text-sm text-gray-500 mb-4">
        Essa ação é irreversível.
      </p>

      <button className="px-5 py-2 bg-red-600 text-white rounded-md">
        Deletar minha conta
      </button>
    </div>
  );
}
