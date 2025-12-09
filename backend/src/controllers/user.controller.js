

export const getProfile = (req, res) => {
  return res.json({
    message: "Profile (placeholder) funcionando",
    user: null,
  });
};

export const updateProfile = async (req, res) => {
  const userId = req.user.id; // ID pego do token (authGuard)
  const { name, email } = req.body;

  // 1. Validação básica
  if (!name && !email) {
    return res.status(400).json({ error: "Nenhum dado enviado para atualização." });
  }

  try {
    // 2. Se o usuário estiver tentando mudar o e-mail, verificar duplicidade
    if (email) {
      const existingUser = await findUserByEmail(email);
      // Se existe usuário com esse email E não é o próprio usuário que está requisitando
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ error: "Este e-mail já está em uso." });
      }
    }

    // 3. Atualizar no banco
    const updatedUser = await updateUserProfile(userId, { name, email });

    if (!updatedUser) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    return res.json({
      message: "Perfil atualizado com sucesso!",
      user: updatedUser
    });

  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({ error: "Erro interno ao atualizar perfil." });
  }
};