export default function MeuPerfil() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      
      {/* Título */}
      <h1 className="text-2xl font-semibold mb-6">
        Meu perfil
      </h1>

      {/* Formulário */}
      <form className="space-y-5">

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Nome
          </label>
          <input
            type="text"
            name="name"
            placeholder="Seu nome"
            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            E-mail
          </label>
          <input
            type="email"
            name="email"
            placeholder="seu@email.com"
            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring"
          />
        </div>

        {/* País */}
        <div>
          <label className="block text-sm font-medium mb-1">
            País
          </label>
          <input
            type="text"
            name="country"
            placeholder="Brasil"
            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring"
          />
        </div>

        {/* Avatar (URL por enquanto) */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Avatar (URL)
          </label>
          <input
            type="text"
            name="avatar_url"
            placeholder="https://..."
            className="w-full rounded-md border px-3 py-2 focus:outline-none focus:ring"
          />
        </div>

        {/* Botão */}
        <div className="pt-4">
          <button
            type="submit"
            className="px-6 py-2 rounded-md bg-black text-white hover:opacity-90 transition"
          >
            Salvar alterações
          </button>
        </div>

      </form>
    </div>
  );
}
