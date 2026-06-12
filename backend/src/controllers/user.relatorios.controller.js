import axios from "axios";

const INDEX_WORDPRESS_GRAPHQL_URL = "https://index.sportinsider.com.br/graphql";
const WORDPRESS_GRAPHQL_URL = "https://sportinsider.com.br/graphql";

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
