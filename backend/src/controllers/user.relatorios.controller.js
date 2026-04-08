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
  const pageSize = parseInt(req.query.pageSize) || 12;

  try {
    const fetchCount = page * pageSize;

    const { data: wpData } = await axios.post(
      WORDPRESS_GRAPHQL_URL,
      {
        query: `
          query GetNotas($first: Int!) {
            notas(
              first: $first
              where: { orderby: { field: DATE, order: DESC }, status: PUBLISH }
            ) {
              pageInfo {
                hasNextPage
                endCursor
              }
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
        error: "Erro ao buscar notas",
        details: wpData.errors
      });
    }

    const { nodes, pageInfo } = wpData.data.notas;

    // paginação fake (igual você fez)
    const offset = (page - 1) * pageSize;
    const filtradas = nodes.filter(
      n => n.newsletterGraph?.exibirNoPro
    );

    const pageItems = filtradas.slice(offset, offset + pageSize);

    return res.status(200).json({
      notas: pageItems,
      pageInfo: {
        hasNextPage: pageInfo?.hasNextPage ?? false,
        endCursor: pageInfo?.endCursor ?? null,
      },
    });

  } catch (error) {
    console.error("Erro ao buscar notas:", error);
    return res.status(500).json({ error: "Erro ao buscar notas" });
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
