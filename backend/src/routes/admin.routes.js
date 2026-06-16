/**
 * @swagger
 * tags:
 *   - name: Admin - Dashboard
 *     description: Painel administrativo
 *   - name: Admin - Countries
 *     description: Gestão de países
 *   - name: Admin - Leagues
 *     description: Gestão de ligas
 *   - name: Admin - Clubs
 *     description: Gestão de clubes
 *   - name: Admin - Users
 *     description: Gestão de usuários
 *   - name: Admin - Plans
 *     description: Gestão de planos
 *   - name: Admin - Notifications
 *     description: Gestão de notificações
 *   - name: Admin - Banners
 *     description: Gestão de banners
 *   - name: Admin - Regions
 *     description: Gestão de regiões e idiomas
 *   - name: Admin - FAQ
 *     description: Gestão de perguntas frequentes
 */

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Retorna dados do painel administrativo
 *     tags: [Admin - Dashboard]
 *     responses:
 *       200:
 *         description: Dados do dashboard retornados com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

// ─────────────────────────────────────────────
// COUNTRIES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/countries:
 *   get:
 *     summary: Lista todos os países
 *     tags: [Admin - Countries]
 *     responses:
 *       200:
 *         description: Lista de países retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/countries/{id}:
 *   get:
 *     summary: Retorna um país pelo ID
 *     tags: [Admin - Countries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do país
 *     responses:
 *       200:
 *         description: País retornado com sucesso
 *       404:
 *         description: País não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/send-countries:
 *   post:
 *     summary: Cria um novo país
 *     tags: [Admin - Countries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do país
 *     responses:
 *       201:
 *         description: País criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/disable-country/{id}:
 *   delete:
 *     summary: Desativa um país pelo ID
 *     tags: [Admin - Countries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do país a ser desativado
 *     responses:
 *       200:
 *         description: País desativado com sucesso
 *       404:
 *         description: País não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

// ─────────────────────────────────────────────
// LEAGUES
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/leagues:
 *   get:
 *     summary: Lista todas as ligas
 *     tags: [Admin - Leagues]
 *     responses:
 *       200:
 *         description: Lista de ligas retornada com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/leagues/{id}:
 *   get:
 *     summary: Retorna uma liga pelo ID
 *     tags: [Admin - Leagues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da liga
 *     responses:
 *       200:
 *         description: Liga retornada com sucesso
 *       404:
 *         description: Liga não encontrada
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/send-league:
 *   post:
 *     summary: Cria uma nova liga
 *     tags: [Admin - Leagues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome da liga
 *               countryId:
 *                 type: string
 *                 description: ID do país associado
 *     responses:
 *       201:
 *         description: Liga criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/leagues/{id}/update:
 *   put:
 *     summary: Atualiza uma liga pelo ID
 *     tags: [Admin - Leagues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da liga
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               countryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Liga atualizada com sucesso
 *       404:
 *         description: Liga não encontrada
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/disable-league/{id}:
 *   delete:
 *     summary: Desativa uma liga pelo ID
 *     tags: [Admin - Leagues]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da liga a ser desativada
 *     responses:
 *       200:
 *         description: Liga desativada com sucesso
 *       404:
 *         description: Liga não encontrada
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/leagues/search:
 *   post:
 *     summary: Busca ligas por filtros
 *     tags: [Admin - Leagues]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Termo de busca
 *     responses:
 *       200:
 *         description: Resultado da busca retornado com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

// ─────────────────────────────────────────────
// CLUBS
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/clubs:
 *   get:
 *     summary: Lista todos os clubes
 *     tags: [Admin - Clubs]
 *     responses:
 *       200:
 *         description: Lista de clubes retornada com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/clubs/{id}:
 *   get:
 *     summary: Retorna um clube pelo ID
 *     tags: [Admin - Clubs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do clube
 *     responses:
 *       200:
 *         description: Clube retornado com sucesso
 *       404:
 *         description: Clube não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/send-club:
 *   post:
 *     summary: Cria um novo clube
 *     tags: [Admin - Clubs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               leagueId:
 *                 type: string
 *               countryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Clube criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/clubs/{id}/update:
 *   put:
 *     summary: Atualiza um clube pelo ID
 *     tags: [Admin - Clubs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do clube
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               leagueId:
 *                 type: string
 *               countryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Clube atualizado com sucesso
 *       404:
 *         description: Clube não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/disable-club/{id}:
 *   delete:
 *     summary: Desativa um clube pelo ID
 *     tags: [Admin - Clubs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do clube a ser desativado
 *     responses:
 *       200:
 *         description: Clube desativado com sucesso
 *       404:
 *         description: Clube não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/attribute-keys:
 *   get:
 *     summary: Retorna as chaves de atributos disponíveis para clubes
 *     tags: [Admin - Clubs]
 *     responses:
 *       200:
 *         description: Chaves de atributos retornadas com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/import-clubs-xlsx:
 *   post:
 *     summary: Importa clubes a partir de um arquivo XLSX
 *     tags: [Admin - Clubs]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo XLSX com os dados dos clubes
 *     responses:
 *       200:
 *         description: Importação realizada com sucesso
 *       400:
 *         description: Arquivo inválido ou mal formatado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/preview-import:
 *   post:
 *     summary: Pré-visualiza os dados de um arquivo XLSX antes de importar clubes
 *     tags: [Admin - Clubs]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo XLSX para pré-visualização
 *     responses:
 *       200:
 *         description: Pré-visualização dos dados retornada com sucesso
 *       400:
 *         description: Arquivo inválido
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/clubs/search:
 *   post:
 *     summary: Busca clubes por filtros
 *     tags: [Admin - Clubs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Termo de busca
 *     responses:
 *       200:
 *         description: Resultado da busca retornado com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/clubs-grouped-by-country:
 *   get:
 *     summary: Retorna clubes agrupados por país
 *     tags: [Admin - Clubs]
 *     responses:
 *       200:
 *         description: Clubes agrupados por país retornados com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/upload-club-logo:
 *   post:
 *     summary: Faz upload do logotipo de um clube
 *     tags: [Admin - Clubs]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Imagem do logotipo do clube
 *     responses:
 *       200:
 *         description: Logotipo enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: URL pública da imagem enviada
 *       400:
 *         description: Arquivo inválido
 *       500:
 *         description: Erro interno do servidor
 */

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Admin - Users]
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/users/{id}:
 *   post:
 *     summary: Retorna um usuário pelo ID
 *     tags: [Admin - Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário retornado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/users/{id}/disable:
 *   post:
 *     summary: Desativa um usuário
 *     tags: [Admin - Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário desativado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/users/{id}/enable:
 *   post:
 *     summary: Ativa um usuário
 *     tags: [Admin - Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário ativado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/users/{id}/change-plan:
 *   post:
 *     summary: Altera o plano de um usuário
 *     tags: [Admin - Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planId
 *             properties:
 *               planId:
 *                 type: string
 *                 description: ID do novo plano
 *     responses:
 *       200:
 *         description: Plano alterado com sucesso
 *       404:
 *         description: Usuário ou plano não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/users/{id}/update:
 *   put:
 *     summary: Atualiza os dados de um usuário (requer autenticação)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       401:
 *         description: Não autorizado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/users/{id}/resend-confirmation:
 *   post:
 *     summary: Reenvia o e-mail de confirmação para o usuário
 *     tags: [Admin - Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: E-mail de confirmação reenviado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/insights/users:
 *   get:
 *     summary: Retorna insights e métricas dos usuários
 *     tags: [Admin - Users]
 *     responses:
 *       200:
 *         description: Insights retornados com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/users/{id}/update-password:
 *   put:
 *     summary: Atualiza a senha de um usuário
 *     tags: [Admin - Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Nova senha do usuário
 *     responses:
 *       200:
 *         description: Senha atualizada com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/create-user:
 *   post:
 *     summary: Cria um novo usuário
 *     tags: [Admin - Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               planId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Dados inválidos ou e-mail já cadastrado
 *       500:
 *         description: Erro interno do servidor
 */

// ─────────────────────────────────────────────
// PLANS
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/plans:
 *   get:
 *     summary: Lista todos os planos
 *     tags: [Admin - Plans]
 *     responses:
 *       200:
 *         description: Lista de planos retornada com sucesso
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo plano
 *     tags: [Admin - Plans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plano criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/plans/{id}:
 *   get:
 *     summary: Retorna um plano pelo ID
 *     tags: [Admin - Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do plano
 *     responses:
 *       200:
 *         description: Plano retornado com sucesso
 *       404:
 *         description: Plano não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   put:
 *     summary: Atualiza um plano pelo ID
 *     tags: [Admin - Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do plano
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Plano atualizado com sucesso
 *       404:
 *         description: Plano não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Desativa um plano pelo ID
 *     tags: [Admin - Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do plano a ser desativado
 *     responses:
 *       200:
 *         description: Plano desativado com sucesso
 *       404:
 *         description: Plano não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/notifications:
 *   post:
 *     summary: Cria uma nova notificação
 *     tags: [Admin - Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               targetUserIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: IDs dos usuários destinatários (vazio = todos)
 *     responses:
 *       201:
 *         description: Notificação criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 *   get:
 *     summary: Lista todas as notificações
 *     tags: [Admin - Notifications]
 *     responses:
 *       200:
 *         description: Lista de notificações retornada com sucesso
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/notifications/{id}:
 *   put:
 *     summary: Atualiza uma notificação pelo ID
 *     tags: [Admin - Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notificação atualizada com sucesso
 *       404:
 *         description: Notificação não encontrada
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Remove uma notificação pelo ID
 *     tags: [Admin - Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação removida com sucesso
 *       404:
 *         description: Notificação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */

// ─────────────────────────────────────────────
// BANNERS
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/banners:
 *   get:
 *     summary: Lista todos os banners
 *     tags: [Admin - Banners]
 *     responses:
 *       200:
 *         description: Lista de banners retornada com sucesso
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria um novo banner
 *     tags: [Admin - Banners]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - imageUrl
 *             properties:
 *               title:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               link:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Banner criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/banners/{id}:
 *   get:
 *     summary: Retorna um banner pelo ID
 *     tags: [Admin - Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do banner
 *     responses:
 *       200:
 *         description: Banner retornado com sucesso
 *       404:
 *         description: Banner não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   put:
 *     summary: Atualiza um banner pelo ID
 *     tags: [Admin - Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do banner
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               link:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Banner atualizado com sucesso
 *       404:
 *         description: Banner não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Remove um banner pelo ID
 *     tags: [Admin - Banners]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do banner
 *     responses:
 *       200:
 *         description: Banner removido com sucesso
 *       404:
 *         description: Banner não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/banners/upload-image:
 *   post:
 *     summary: Faz upload de uma imagem para o banner
 *     tags: [Admin - Banners]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Imagem do banner
 *     responses:
 *       200:
 *         description: Imagem enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       400:
 *         description: Arquivo inválido
 *       500:
 *         description: Erro interno do servidor
 */

// ─────────────────────────────────────────────
// REGIONS
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/regions:
 *   get:
 *     summary: Lista todas as regiões
 *     tags: [Admin - Regions]
 *     responses:
 *       200:
 *         description: Lista de regiões retornada com sucesso
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria uma nova região
 *     tags: [Admin - Regions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       201:
 *         description: Região criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/regions/{id}:
 *   get:
 *     summary: Retorna uma região pelo ID
 *     tags: [Admin - Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da região
 *     responses:
 *       200:
 *         description: Região retornada com sucesso
 *       404:
 *         description: Região não encontrada
 *       500:
 *         description: Erro interno do servidor
 *   put:
 *     summary: Atualiza uma região pelo ID
 *     tags: [Admin - Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da região
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: Região atualizada com sucesso
 *       404:
 *         description: Região não encontrada
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Remove uma região pelo ID
 *     tags: [Admin - Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da região
 *     responses:
 *       200:
 *         description: Região removida com sucesso
 *       404:
 *         description: Região não encontrada
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/regions/{id}/financial-indicators:
 *   get:
 *     summary: Retorna os indicadores financeiros de uma região
 *     tags: [Admin - Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da região
 *     responses:
 *       200:
 *         description: Indicadores financeiros retornados com sucesso
 *       404:
 *         description: Região não encontrada
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Salva as traduções dos indicadores financeiros de uma região
 *     tags: [Admin - Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da região
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Objeto com as traduções dos indicadores financeiros
 *     responses:
 *       200:
 *         description: Traduções salvas com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/regions/{id}/common-terms:
 *   get:
 *     summary: Retorna os termos comuns de uma região
 *     tags: [Admin - Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da região
 *     responses:
 *       200:
 *         description: Termos comuns retornados com sucesso
 *       404:
 *         description: Região não encontrada
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Salva as traduções dos termos comuns de uma região
 *     tags: [Admin - Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da região
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Objeto com as traduções dos termos comuns
 *     responses:
 *       200:
 *         description: Traduções salvas com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

// ─────────────────────────────────────────────
// FAQ
// ─────────────────────────────────────────────

/**
 * @swagger
 * /admin/faq:
 *   get:
 *     summary: Lista todas as perguntas frequentes
 *     tags: [Admin - FAQ]
 *     responses:
 *       200:
 *         description: Lista de FAQs retornada com sucesso
 *       500:
 *         description: Erro interno do servidor
 *   post:
 *     summary: Cria uma nova pergunta frequente
 *     tags: [Admin - FAQ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - answer
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: FAQ criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/faq/{id}:
 *   put:
 *     summary: Atualiza uma pergunta frequente pelo ID
 *     tags: [Admin - FAQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do FAQ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: FAQ atualizado com sucesso
 *       404:
 *         description: FAQ não encontrado
 *       500:
 *         description: Erro interno do servidor
 *   delete:
 *     summary: Remove uma pergunta frequente pelo ID
 *     tags: [Admin - FAQ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do FAQ
 *     responses:
 *       200:
 *         description: FAQ removido com sucesso
 *       404:
 *         description: FAQ não encontrado
 *       500:
 *         description: Erro interno do servidor
 */

/**
 * @swagger
 * /admin/faq/order:
 *   patch:
 *     summary: Atualiza a ordem de exibição das perguntas frequentes
 *     tags: [Admin - FAQ]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderedIds
 *             properties:
 *               orderedIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Lista de IDs dos FAQs na nova ordem desejada
 *     responses:
 *       200:
 *         description: Ordem atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
import { Router } from "express";
import { previewClubImport, uploadClubXlsx, previewLeagueImport, uploadLeagueXlsx, getAttributeKeys, createUser, getAdminDashboard, disableCountry, createCountry, updateCountry, getAllCountries, getAllLeagues, getAllCountriesById, getAllUsers, getUserById, disableUser, enableUser, changeUserPlan, resendConfirmationEmail, updateUser, updateUserPassword, getLeagueById, createLeague, updateLeague, disableLeague, saveLeagueStructure, getAllClubs, clubsGroupedByCountry, clubsSearch, leaguesSearch, getClubById, createClub, updateClub, disableClub, bulkDisableClubs, getAllFaqs, createFaq, updateFaq, deleteFaq, updateFaqOrder, fetchTeamFromSportsDB, fetchPlayerFromSportsDB, adminGetPlayers, updatePlayerPhoto, getCustomEditorData, saveGroupAssignments, createCustomMatch, updateCustomMatch, deleteCustomMatch, generateMatchesFromGroups, addClubToSeason, removeClubFromSeason, getAllContinents, createContinent, updateContinent, disableContinent, getAllFederations, createFederation, updateFederation, disableFederation, getTournamentSuggestions, bulkAssignPhases, getGroupClubs, saveGroupClubs, searchStadiums, listHospitality, upsertHospitality, deleteHospitality, createHiddenClub, getLeagueMatches } from "../controllers/admin.controller.js";
import { getAllLegalSections, createLegalSection, updateLegalSection, deleteLegalSection, updateLegalOrder } from "../controllers/legal.controller.js";
import { getAllUpdateNotes, createUpdateNote, updateUpdateNote, deleteUpdateNote, updateNotesOrder } from "../controllers/updateNotes.controller.js";
import { getUsersInsights, getClubsInsights, getLeaguesInsights, getFinanceiroInsights, getPlanosInsights, getImportacoesInsights, getUsoInsights, getPerformanceInsights } from "../controllers/insights.controller.js";
import { getAllPlans, getPlanById, createPlan, updatePlan, disablePlan } from "../controllers/admin.plans.controller.js";
import { uploadXlsx } from "../middlewares/uploadXlsx.js";
import { uploadImage } from "../middlewares/uploadImage.js";
import { uploadFederationImage } from "../middlewares/uploadFederationImage.js";
import { uploadEditionImage } from "../middlewares/uploadEditionImage.js";
import { uploadLeagueImage } from "../middlewares/uploadLeagueImage.js";
import { uploadClubLogo, uploadFederationLogo, uploadEditionLogo, uploadLeagueLogo } from "../controllers/upload.controller.js";
import { newNotification, listNotifications, updateNotification, deleteNotification } from "../controllers/notification.controller.js";
import { getAllBanners, getBannerById, createBanner, updateBanner, deleteBanner, uploadBannerImage, reorderBanners } from "../controllers/banner.controller.js";
import { getAllRegions, deleteRegion, createRegion, updateRegion, getRegionById, getFinancialIndicatorsByRegion, saveFinancialIndicatorsTranslations, getCommonTermsByRegion, saveCommonTermsTranslations } from "../controllers/adminRegionsController.js";
import { previewFederationFinancial, importFederationFinancial, getEditionsByLeague, getFederationCycleFinancials, listFederationFinancialSheets } from "../controllers/federationFinancial.controller.js";

import { adminGuard } from "../middlewares/auth.middleware.js";
import { getMaintenanceOverview, toggleCountry, toggleLeague, toggleFederation, bulkToggle, getSystemFeatures, toggleSystemFeature } from "../controllers/maintenance.controller.js";
import { clearApiCache } from "../middlewares/apiCache.middleware.js";
const router = Router();

// Qualquer escrita no admin (imports, CRUDs) invalida o cache do dashboard público
router.use((req, res, next) => {
  if (req.method !== "GET") {
    res.on("finish", () => {
      if (res.statusCode < 400) clearApiCache();
    });
  }
  next();
});

//router.use(adminGuard);

// GET /admin/dashboard
router.get("/dashboard", getAdminDashboard);

// PAÍSES - GESTÃO CRUD
router.get("/countries", getAllCountries);
router.get("/countries/:id", getAllCountriesById);
router.post("/send-countries", adminGuard, createCountry);
router.put("/countries/:id/update", adminGuard, updateCountry);
router.delete("/disable-country/:id", adminGuard, disableCountry);

// CONTINENTES - GESTÃO CRUD
router.get("/continents", getAllContinents);
router.post("/continents", adminGuard, createContinent);
router.put("/continents/:id", adminGuard, updateContinent);
router.delete("/continents/:id", adminGuard, disableContinent);

// MODO MANUTENÇÃO
router.get("/maintenance/overview",              adminGuard, getMaintenanceOverview);
router.put("/maintenance/country/:id/toggle",    adminGuard, toggleCountry);
router.put("/maintenance/league/:id/toggle",     adminGuard, toggleLeague);
router.put("/maintenance/federation/:id/toggle", adminGuard, toggleFederation);
router.post("/maintenance/bulk",                 adminGuard, bulkToggle);
router.get("/maintenance/system",                adminGuard, getSystemFeatures);
router.put("/maintenance/system/:key",           adminGuard, toggleSystemFeature);

// FEDERAÇÕES - GESTÃO CRUD
router.get("/federations", getAllFederations);
router.post("/federations", adminGuard, createFederation);
router.put("/federations/:id", adminGuard, updateFederation);
router.delete("/federations/:id", adminGuard, disableFederation);

// LIGAS - GESTÃO CRUD
router.get("/leagues", getAllLeagues);
router.get("/leagues/:id", getLeagueById);
router.post("/send-league", adminGuard, createLeague);
router.put("/leagues/:id/update", adminGuard, updateLeague);
router.put("/leagues/:id/structure", adminGuard, saveLeagueStructure);
router.delete("/disable-league/:id", adminGuard, disableLeague);
router.post("/leagues/search", adminGuard, leaguesSearch);

// EDITOR DE LIGA PERSONALIZADA
router.get("/leagues/:id/seasons/:year/editor", adminGuard, getCustomEditorData);
router.put("/leagues/:id/seasons/:year/groups", adminGuard, saveGroupAssignments);
router.post("/leagues/:id/seasons/:year/clubs", adminGuard, addClubToSeason);
router.delete("/leagues/:id/seasons/:year/clubs/:clubId", adminGuard, removeClubFromSeason);
router.get("/leagues/:id/matches", adminGuard, getLeagueMatches);
router.post("/leagues/:id/seasons/:year/matches", adminGuard, createCustomMatch);
router.post("/leagues/:id/seasons/:year/matches/generate", adminGuard, generateMatchesFromGroups);
router.put("/matches/:id", adminGuard, updateCustomMatch);
router.delete("/matches/:id", adminGuard, deleteCustomMatch);

// MAPEAMENTO DE TORNEIOS/FASES
router.get("/leagues/:id/seasons/:year/tournament-suggestions", adminGuard, getTournamentSuggestions);
router.post("/leagues/:id/seasons/:year/assign-phases", adminGuard, bulkAssignPhases);
router.get("/leagues/:id/seasons/:year/group-clubs", adminGuard, getGroupClubs);
router.post("/leagues/:id/seasons/:year/group-clubs", adminGuard, saveGroupClubs);

// THESPORTSDB PROXIES
router.get("/thesportsdb/team", adminGuard, fetchTeamFromSportsDB);
router.get("/thesportsdb/player", adminGuard, fetchPlayerFromSportsDB);

// JOGADORES - GESTÃO
router.get("/players", adminGuard, adminGetPlayers);
router.put("/players/:id/photo", adminGuard, updatePlayerPhoto);

// CLUBES - GESTÃO CRUD
router.get("/clubs", getAllClubs);
router.get("/clubs/:id", getClubById);
router.post("/send-club", adminGuard, createClub);
router.post("/clubs/create-hidden", adminGuard, createHiddenClub);
router.put("/clubs/:id/update", adminGuard, updateClub);
router.delete("/disable-club/:id", adminGuard, disableClub);
router.post("/clubs/bulk-disable", adminGuard, bulkDisableClubs);
router.get("/attribute-keys", getAttributeKeys);
router.post("/import-clubs-xlsx", adminGuard, uploadXlsx, uploadClubXlsx);
router.post("/preview-import", adminGuard, uploadXlsx, previewClubImport);
router.post("/import-leagues-xlsx", adminGuard, uploadXlsx, uploadLeagueXlsx);
router.post("/preview-league-import", adminGuard, uploadXlsx, previewLeagueImport);
router.post("/clubs/search", adminGuard, clubsSearch);
router.get("/clubs-grouped-by-country", clubsGroupedByCountry);

// USUÁRIOS - GESTÃO
router.get("/users", getAllUsers);
router.post("/users/:id", adminGuard, getUserById);
router.post("/users/:id/disable", adminGuard, disableUser);
router.post("/users/:id/enable", adminGuard, enableUser);
router.post("/users/:id/change-plan", adminGuard, changeUserPlan);
router.put("/users/:id/update", adminGuard, updateUser);
router.post("/users/:id/resend-confirmation", adminGuard, resendConfirmationEmail);
router.get("/insights/users", getUsersInsights);
router.get("/insights/clubes", getClubsInsights);
router.get("/insights/ligas", getLeaguesInsights);
router.get("/insights/financeiro", getFinanceiroInsights);
router.get("/insights/planos", getPlanosInsights);
router.get("/insights/importacoes", getImportacoesInsights);
router.get("/insights/uso", getUsoInsights);
router.get("/insights/performance", getPerformanceInsights);
router.put("/users/:id/update-password", adminGuard, updateUserPassword);
router.post("/create-user", adminGuard, createUser); // Criar usuaário 

// Subir foto do clube
router.post("/upload-club-logo", uploadImage, uploadClubLogo);
router.post("/federations/upload-logo", adminGuard, uploadFederationImage, uploadFederationLogo);
router.post("/editions/upload-logo", adminGuard, uploadEditionImage, uploadEditionLogo);
router.post("/leagues/upload-logo", adminGuard, uploadLeagueImage, uploadLeagueLogo);

// FINANCEIRO DE COMPETIÇÕES DE FEDERAÇÃO (Copa do Mundo, Copa América, Euro...)
router.post("/federation-financial/sheets", adminGuard, uploadXlsx, listFederationFinancialSheets);
router.post("/federation-financial/preview", adminGuard, uploadXlsx, previewFederationFinancial);
router.post("/federation-financial/import",  adminGuard, uploadXlsx, importFederationFinancial);
router.get("/federation-financial/editions/:id", adminGuard, getEditionsByLeague);

// PLANOS - CRUD
router.get("/plans", getAllPlans);
router.get("/plans/:id", getPlanById);
router.post("/plans", adminGuard, createPlan);
router.put("/plans/:id", adminGuard, updatePlan);
router.delete("/plans/:id", adminGuard, disablePlan);

// Notificações 
router.post("/notifications", newNotification);
router.get("/notifications", listNotifications);
router.put("/notifications/:id", updateNotification);
router.delete("/notifications/:id", deleteNotification);


// Banners
router.get("/banners", getAllBanners);
router.post("/banners", adminGuard, createBanner);
router.put("/banners/reorder", reorderBanners);
router.post("/banners/upload-image", uploadImage, uploadBannerImage);
router.get("/banners/:id", getBannerById);
router.put("/banners/:id", adminGuard, updateBanner);
router.delete("/banners/:id", deleteBanner);

// Regiões e idiomas
router.get("/regions", getAllRegions);
router.get("/regions/:id", getRegionById);
router.post("/regions", createRegion);
router.put("/regions/:id", updateRegion);
router.delete("/regions/:id", deleteRegion);
router.get("/regions/:id/financial-indicators", getFinancialIndicatorsByRegion);
router.post("/regions/:id/financial-indicators", saveFinancialIndicatorsTranslations);
router.get("/regions/:id/common-terms", getCommonTermsByRegion);
router.post("/regions/:id/common-terms", saveCommonTermsTranslations);

// Faq
router.get("/faq", getAllFaqs);
router.post("/faq", adminGuard, createFaq);
router.put("/faq/:id", adminGuard, updateFaq);
router.delete("/faq/:id", adminGuard, deleteFaq);
router.patch("/faq/order", updateFaqOrder);

// Páginas legais (/legal)
router.get("/legal", getAllLegalSections);
router.post("/legal", adminGuard, createLegalSection);
router.patch("/legal/order", updateLegalOrder);
router.put("/legal/:id", adminGuard, updateLegalSection);
router.delete("/legal/:id", adminGuard, deleteLegalSection);

// Notas de atualização (/update-notes)
router.get("/update-notes", getAllUpdateNotes);
router.post("/update-notes", adminGuard, createUpdateNote);
router.patch("/update-notes/order", updateNotesOrder);
router.put("/update-notes/:id", adminGuard, updateUpdateNote);
router.delete("/update-notes/:id", adminGuard, deleteUpdateNote);


export default router;


/***
 * DEPPOS VER SE VAI SER MELHOR DIVIDIR OS CONTROLERS DO ADMIN PQ VAI FICAR ENORME
 */



// ─── Hospitalidade ────────────────────────────────────────────────────────────
router.get("/hospitality/stadiums", searchStadiums);
router.get("/hospitality", listHospitality);
router.post("/hospitality", adminGuard, upsertHospitality);
router.delete("/hospitality/:id", adminGuard, deleteHospitality);
