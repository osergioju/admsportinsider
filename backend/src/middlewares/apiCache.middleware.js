// Cache em memória para GETs anônimos de leitura pública.
// Regra de segurança: requisição com Authorization NUNCA é cacheada nem
// servida do cache — respostas podem variar por usuário (ver financialContext,
// que usa a moeda preferida do usuário logado quando não há ?to= na query).
const store = new Map();
const MAX_ENTRIES = 1000;

export function apiCache(ttlSeconds = 300) {
  const ttlMs = ttlSeconds * 1000;
  const cacheControl = `public, s-maxage=${ttlSeconds}, stale-while-revalidate=60`;

  return (req, res, next) => {
    if (req.method !== "GET" || req.headers.authorization) return next();

    const key = req.originalUrl;
    const hit = store.get(key);
    if (hit && hit.expires > Date.now()) {
      res.set("Cache-Control", cacheControl);
      res.set("Vary", "Authorization");
      res.set("X-Cache", "HIT");
      return res.status(200).json(hit.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        if (store.size >= MAX_ENTRIES) {
          for (const [k, v] of store) {
            if (v.expires <= Date.now()) store.delete(k);
          }
          if (store.size >= MAX_ENTRIES) store.clear();
        }
        store.set(key, { body, expires: Date.now() + ttlMs });
        res.set("Cache-Control", cacheControl);
        res.set("Vary", "Authorization");
        res.set("X-Cache", "MISS");
      }
      return originalJson(body);
    };

    next();
  };
}

export function clearApiCache() {
  store.clear();
}
