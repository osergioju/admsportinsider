export default function PrivacyDelete() {
  return (
    <div>
      <h1 className="text-xl font-medium text-red-600 mb-4">
        Delete account
      </h1>

      <p className="text-sm text-gray-500 mb-4">
        This action is irreversible.
      </p>

      <button className="px-5 py-2 bg-red-600 text-white rounded-md">
        Delete my account
      </button>
    </div>
  );
}
