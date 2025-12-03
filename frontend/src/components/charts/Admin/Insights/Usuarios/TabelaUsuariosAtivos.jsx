export default function TabelaUsuariosAtivos({ data }) {

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Nenhum usuário ativo encontrado
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      <table className="min-w-full text-sm">

        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Nome</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">E-mail</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Acessos</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {data.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">{user.name}</td>
              <td className="px-4 py-2 text-gray-600">{user.email}</td>
              <td className="px-4 py-2 font-semibold">{user.login_count}</td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
