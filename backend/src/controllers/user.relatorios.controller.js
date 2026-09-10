import axios from "axios";

const INDEX_WORDPRESS_GRAPHQL_URL = "https://index.sportinsider.com.br/graphql";
const WORDPRESS_GRAPHQL_URL = "https://sportinsider.com.br/graphql";

// ─── Carrossel de Publicações (bloco "carousel" do módulo Publicações) ───────
// Fonte real (confirmada via GraphQL em 2026-09-05):
// - "publicacoes" (CPT unificado) tem um campo ACF `tipo.tipo` (valores vistos:
//   "nota", "destaque") e uma taxonomia `categorias` (slugs vistos: financas,
//   gestao, notas, marketing, midia, sociedade, investigacao).
// - "Finanças" não é um tipo, é a categoria de slug "financas" dentro de
//   publicacoes (pode ter tipo nota OU destaque).
// - "Publicação externa" é um CPT à parte (publicaEsExternas), sem o campo tipo.
// WPGraphQL não expõe filtro nativo por esse ACF/taxonomia aqui, então
// busca-se um lote recente e filtra-se em memória.
const PUBLICATIONS_QUERY = `
  query GetPublicacoes($first: Int!) {
    publicacoes(first: $first, where: { orderby: { field: DATE, order: DESC }, status: PUBLISH }) {
      nodes {
        id
        title
        link
        date
        featuredImage { node { sourceUrl } }
        tipo { tipo }
        categorias { nodes { slug } }
      }
    }
  }
`;

const EXTERNAL_PUBLICATIONS_QUERY = `
  query GetPublicacoesExternas($first: Int!) {
    publicaEsExternas(first: $first, where: { orderby: { field: DATE, order: DESC }, status: PUBLISH }) {
      nodes {
        id
        title
        link
        date
        featuredImage { node { sourceUrl } }
      }
    }
  }
`;

function normalizePublication(node) {
  return {
    id: node.id,
    title: node.title,
    link: node.link,
    date: node.date,
    image: node.featuredImage?.node?.sourceUrl || null,
  };
}

export const getWordpressPublications = async (req, res) => {
  const source = req.query.source; // "nota" | "destaque" | "financas" | "externa"
  const limit = Math.min(parseInt(req.query.limit) || 4, 20);

  if (!["nota", "destaque", "financas", "externa"].includes(source)) {
    return res.status(400).json({ message: "source inválido (use nota, destaque, financas ou externa)" });
  }

  try {
    if (source === "externa") {
      const { data: wpData } = await axios.post(
        WORDPRESS_GRAPHQL_URL,
        { query: EXTERNAL_PUBLICATIONS_QUERY, variables: { first: limit } },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );
      if (wpData.errors) throw new Error(JSON.stringify(wpData.errors));
      const items = (wpData.data.publicaEsExternas?.nodes || []).map(normalizePublication);
      return res.json({ items });
    }

    // nota / destaque / financas — busca um lote recente e filtra em memória
    const { data: wpData } = await axios.post(
      WORDPRESS_GRAPHQL_URL,
      { query: PUBLICATIONS_QUERY, variables: { first: 40 } },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );
    if (wpData.errors) throw new Error(JSON.stringify(wpData.errors));

    const nodes = wpData.data.publicacoes?.nodes || [];
    const filtered =
      source === "financas"
        ? nodes.filter((n) => (n.categorias?.nodes || []).some((c) => c.slug === "financas"))
        : nodes.filter((n) => n.tipo?.tipo === source);

    return res.json({ items: filtered.slice(0, limit).map(normalizePublication) });
  } catch (error) {
    console.error("Erro ao buscar publicações do WordPress:", error.message);
    return res.status(500).json({ message: "Erro ao buscar publicações" });
  }
};

/**
 * BUSCAR RELATÓRIOS (paginado via GraphQL cursor)
 */
export const getRelatorios = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 12;

  try {
    // 1ª chamada: busca TODOS os cursors até a página desejada
    // GraphQL do WP usa cursor-based pagination, então simulamos offset
    // buscando `page * pageSize` itens e fatiando no final
    const fetchCount = page * pageSize;

    const { data: wpData } = await axios.post(
      INDEX_WORDPRESS_GRAPHQL_URL,
      {
        query: `
          query GetRelatorios($first: Int!) {
            relatorios(
                first: $first
                where: { orderby: { field: DATE, order: DESC }, status: PUBLISH }
            ) {
                pageInfo {
                hasNextPage
                endCursor
                }
                nodes {
                title
                uri
                featuredImage {
                    node {
                    sourceUrl
                    altText
                    }
                }
                }
            }
            }
        `,
        variables: { first: fetchCount },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    if (wpData.errors) {
      console.error("GraphQL errors:", wpData.errors);
      return res.status(400).json({ error: "Erro ao buscar relatórios", details: wpData.errors });
    }

    const { nodes, pageInfo } = wpData.data.relatorios;

    // Fatia os itens da página atual
    const offset = (page - 1) * pageSize;
    const pageItems = nodes.slice(offset, offset + pageSize);
    const total = nodes.length; // total recebido até agora

    return res.status(200).json({
      relatorios: pageItems,
      pageInfo: {
        hasNextPage: pageInfo?.hasNextPage ?? false,
        endCursor: pageInfo?.endCursor ?? null,
      },
    });

  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    return res.status(500).json({ error: "Erro ao buscar relatórios" });
  }
};

export const getNotas = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 8; // reduzi (boa prática)

  try {
    const fetchCount = page * pageSize;

    const { data: wpData } = await axios.post(
      WORDPRESS_GRAPHQL_URL,
      {
        query: `
          query GetConteudos($first: Int!) {
            notas(
              first: $first
              where: { orderby: { field: DATE, order: DESC }, status: PUBLISH }
            ) {
              nodes {
                id
                title
                slug
                date
                featuredImage {
                  node {
                    sourceUrl
                  }
                }
                newsletterGraph {
                  exibirNoPro
                }
              }
            }

            allNewsletter {
              nodes {
                title
                uri
              }
            }
          }
        `,
        variables: { first: fetchCount },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    if (wpData.errors) {
      console.error("GraphQL errors:", wpData.errors);
      return res.status(400).json({
        error: "Erro ao buscar conteúdos",
        details: wpData.errors,
      });
    }

    // ------------------------
    // 🔹 NOTAS
    // ------------------------
    const notas = (wpData.data.notas?.nodes || [])
      .map(n => ({
        id: n.id,
        title: n.title,
        slug: n.slug,
        date: n.date,
        image: n.featuredImage?.node?.sourceUrl || null,
        type: "nota",
      }));

    // ------------------------
    // 🔹 NEWSLETTERS
    // ------------------------
    const newsletters = (wpData.data.allNewsletter?.nodes || [])
      .map(n => ({
        id: n.uri, // não tem id, usei uri
        title: n.title,
        slug: n.uri,
        date: null, // não veio data (se tiver, adiciona na query)
        image: null,
        type: "newsletter",
      }));

    // ------------------------
    // 🔥 JUNTA TUDO
    // ------------------------
    let tudo = [...notas, ...newsletters];


    // ordena (newsletter sem data vai pro final)
    tudo.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });


    // ------------------------
    // 📄 PAGINAÇÃO
    // ------------------------
    const offset = (page - 1) * pageSize;
    const pageItems = tudo.slice(offset, offset + pageSize);

    return res.status(200).json({
      conteudos: pageItems,
      pagination: {
        page,
        pageSize,
        total: tudo.length,
        hasNextPage: offset + pageSize < tudo.length,
      },
    });

  } catch (error) {
    console.error("Erro ao buscar conteúdos:", error);
    return res.status(500).json({ error: "Erro ao buscar conteúdos" });
  }
};

/**
 * BUSCAR RELATÓRIO POR ID
 */
export const getRelatorioById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: wpData } = await axios.post(
      WORDPRESS_GRAPHQL_URL,
      {
        query: `
          query GetRelatorio($id: ID!) {
            relatorio(id: $id, idType: DATABASE_ID) {
              id
              databaseId
              title
              date
              relatorioFields {
                capa {
                  sourceUrl
                  altText
                }
                linkPdf
                descricao
              }
            }
          }
        `,
        variables: { id },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    if (wpData.errors || !wpData.data.relatorio) {
      return res.status(404).json({ error: "Relatório não encontrado" });
    }

    return res.status(200).json({ data: wpData.data.relatorio });

  } catch (error) {
    console.error("Erro ao buscar relatório:", error);
    return res.status(500).json({ error: "Erro ao buscar relatório" });
  }
};
