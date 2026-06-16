-- Tabela de seções da página /legal (Responsabilidade legal), editável pelo admin.
-- Mesmo padrão de `faqs`: CRUD + ordenação + is_active.

CREATE TABLE IF NOT EXISTS legal_sections (
  id          SERIAL PRIMARY KEY,
  tag         TEXT        NOT NULL,                 -- título da seção (ex.: "Natureza da informação")
  paragraphs  JSONB       NOT NULL DEFAULT '[]',    -- legado: array de strings (fallback)
  body_html   TEXT,                                 -- conteúdo rico (WYSIWYG) — fonte da verdade
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Se a tabela já existia (migration anterior sem body_html), adiciona a coluna.
ALTER TABLE legal_sections ADD COLUMN IF NOT EXISTS body_html TEXT;

-- Seed com o conteúdo atual hardcoded em frontend/src/Pages/Legal.jsx (paragraphs + HTML)
INSERT INTO legal_sections (tag, paragraphs, body_html, sort_order, is_active)
SELECT * FROM (VALUES
  (
    'Natureza da informação',
    '["Todos os dados expostos têm origem em comunicados oficiais e documentos públicos das entidades esportivas, sobretudo demonstrações contábeis de clubes e federações, exceto quando indicada outra fonte em casos eventuais.","Demonstrações contábeis refletem os dados apurados pelas próprias entidades esportivas. A depender da legislação de cada país, pode haver verificação por parte de auditoria externa independente, mas o parecer pode não estar disponível."]'::jsonb,
    '<p>Todos os dados expostos têm origem em comunicados oficiais e documentos públicos das entidades esportivas, sobretudo demonstrações contábeis de clubes e federações, exceto quando indicada outra fonte em casos eventuais.</p><p>Demonstrações contábeis refletem os dados apurados pelas próprias entidades esportivas. A depender da legislação de cada país, pode haver verificação por parte de auditoria externa independente, mas o parecer pode não estar disponível.</p>',
    0, TRUE
  ),
  (
    'Responsabilidade legal',
    '["O Sport Insider não fornece garantia quanto à precisão ou integridade das informações contidas em tais documentos, e não assume qualquer responsabilidade sobre os resultados de decisões baseadas nesses dados.","Investidores, executivos e demais stakeholders interessados no PRO precisam sempre realizar suas próprias investigações e análises, e são aconselhados a buscar aconselhamento profissional nas áreas jurídica, financeira e tributária.","Nada nesta ferramenta deve ser interpretado ou considerado como garantia ou representação quanto ao futuro, nem deve substituir o processo de due diligence que um investidor realiza antes de decidir como alocar seus investimentos."]'::jsonb,
    '<p>O Sport Insider não fornece garantia quanto à precisão ou integridade das informações contidas em tais documentos, e não assume qualquer responsabilidade sobre os resultados de decisões baseadas nesses dados.</p><p>Investidores, executivos e demais stakeholders interessados no PRO precisam sempre realizar suas próprias investigações e análises, e são aconselhados a buscar aconselhamento profissional nas áreas jurídica, financeira e tributária.</p><p>Nada nesta ferramenta deve ser interpretado ou considerado como garantia ou representação quanto ao futuro, nem deve substituir o processo de due diligence que um investidor realiza antes de decidir como alocar seus investimentos.</p>',
    1, TRUE
  ),
  (
    'Eventos subsequentes',
    '["Todos os dados expostos refletem as informações disponíveis até a publicação do respectivo documento, como o encerramento do exercício fiscal de uma demonstração contábil. O Sport Insider não tem obrigação legal de atualizar ou revisar novas informações que possam ser publicadas após a data inicial."]'::jsonb,
    '<p>Todos os dados expostos refletem as informações disponíveis até a publicação do respectivo documento, como o encerramento do exercício fiscal de uma demonstração contábil. O Sport Insider não tem obrigação legal de atualizar ou revisar novas informações que possam ser publicadas após a data inicial.</p>',
    2, TRUE
  )
) AS seed(tag, paragraphs, body_html, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM legal_sections);
