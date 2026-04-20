export default function TabelaUltimosUsuarios({ data }) {

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Nenhum usuário encontrado
      </div>
    );
  }

  const maskEmail = (email) => {
    if (!email) return '-'
    const [user, domain] = email.split('@')
    const visible = user.slice(0, 2)
    return `${visible}***@${domain}`
  }

  // Função simples para formatar a data
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <table className="min-w-full text-sm">
        
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Nome</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">E-mail</th>
            <th className="px-4 py-2 text-left font-medium text-gray-500">Criado em</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {data.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">{user.name}</td>
              <td className="px-4 py-2 text-gray-600">{maskEmail(user.email)}</td>
              <td className="px-4 py-2">{formatDate(user.created_at)}</td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
