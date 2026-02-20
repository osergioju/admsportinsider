import db from  "../config/db.js";

// LISTAR TODAS AS MOEDAS ATIVAS
export async function getAllCurrencies(req, res) {
    try {
        const { rows: currencies } = await db.query(`
            SELECT 
                c.*,
                co.name AS country_name,
                co.flag_url
            FROM currencies c
            LEFT JOIN countries co 
                ON c.id_country = co.id_country
            WHERE c.active = true
            ORDER BY c.created_at DESC
        `);

        
        res.json(currencies);
    } catch (error) {
        console.error('Erro ao buscar moedas:', error);
        res.status(500).json({ error: 'Erro ao buscar moedas' });
    }
};

// BUSCAR MOEDA POR ID
export async function getCurrencyById(req, res) {
    try {
        const { id } = req.params;
        
        const [currency] = await db.query(`
            SELECT 
                c.*, 
                co.name AS country_name,
                co.flag_url
            FROM currencies c
            LEFT JOIN countries co 
                ON c.id_country = co.id_country
            WHERE c.id = "?"
            AND c.active = true;;

        `, [id]);
        
        if (!currency.length) {
            return res.status(404).json({ error: 'Moeda não encontrada' });
        }
        
        res.json(currency[0]);
    } catch (error) {
        console.error('Erro ao buscar moeda:', error);
        res.status(500).json({ error: 'Erro ao buscar moeda' });
    }
};

// CRIAR NOVA MOEDA
export async function createCurrency(req, res) {
    try {
        const { id_country, code, name, symbol } = req.body;

        if (!id_country || !code || !name || !symbol) {
            return res.status(400).json({ 
                error: 'Todos os campos são obrigatórios' 
            });
        }

        // Verifica se já existe moeda ativa para o país
        const { rows: existing } = await db.query(
            `
            SELECT id 
            FROM currencies 
            WHERE id_country = $1 
              AND active = true
            `,
            [id_country]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                error: 'Já existe uma moeda cadastrada para este país' 
            });
        }

        // Insere e retorna o ID criado
        const { rows } = await db.query(
            `
            INSERT INTO currencies 
                (id_country, code, name, symbol, active, created_at)
            VALUES 
                ($1, $2, $3, $4, true, NOW())
            RETURNING id
            `,
            [id_country, code.toUpperCase(), name, symbol]
        );

        res.status(201).json({
            id: rows[0].id,
            id_country,
            code: code.toUpperCase(),
            name,
            symbol,
            message: 'Moeda cadastrada com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao criar moeda:', error);
        res.status(500).json({ 
            error: 'Erro ao cadastrar moeda' 
        });
    }
}


// ATUALIZAR MOEDA
export async function updateCurrency(req, res) {
    try {
        const { id } = req.params;
        const { code, name, symbol } = req.body;
        
        const [result] = await db.query(`
            UPDATE currencies 
            SET code = ?, name = ?, symbol = ?
            WHERE id = ? AND active = 1
        `, [code.toUpperCase(), name, symbol, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Moeda não encontrada' });
        }
        
        res.json({ message: 'Moeda atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar moeda:', error);
        res.status(500).json({ error: 'Erro ao atualizar moeda' });
    }
};

// DESABILITAR MOEDA
export async function disableCurrency(req, res) {
    try {
        const { id } = req.params;
        
        const [result] = await db.query(
            'UPDATE currencies SET active = 0 WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Moeda não encontrada' });
        }
        
        res.json({ message: 'Moeda desabilitada com sucesso!' });
    } catch (error) {
        console.error('Erro ao desabilitar moeda:', error);
        res.status(500).json({ error: 'Erro ao desabilitar moeda' });
    }
};

// LISTAR PAÍSES DISPONÍVEIS (que ainda não têm moeda)
export async function getAvailableCountries(req, res) {
    try {
        const [countries] = await db.query(`
            SELECT co.id, co.name, co.code
            FROM countries co
            LEFT JOIN currencies c ON co.id = c.id_country AND c.active = 1
            WHERE co.active = 1 AND c.id IS NULL
            ORDER BY co.name
        `);
        
        res.json(countries);
    } catch (error) {
        console.error('Erro ao buscar países disponíveis:', error);
        res.status(500).json({ error: 'Erro ao buscar países disponíveis' });
    }
};

// LISTAR OUTRAS MOEDAS PARA CRIAR PARES (exceto a moeda atual)
export async function getOtherCurrencies(req, res) {
    try {
        const { currencyId } = req.params;
        
        const { rows: currencies } = await db.query(`
        SELECT 
            c.id,
            c.code,
            c.name,
            c.symbol,
            co.name AS country_name
        FROM currencies c
        LEFT JOIN countries co 
            ON c.id_country = co.id_country
        WHERE c.id <> $1
        AND c.active = true
        ORDER BY c.code
    `, [currencyId]);

        
        res.json(currencies);
    } catch (error) {
        console.error('Erro ao buscar outras moedas:', error);
        res.status(500).json({ error: 'Erro ao buscar outras moedas' });
    }
};

// CRIAR PAR DE CÂMBIO
export async function createCurrencyPair(req, res) {
    try {
        const { from_currency_id, to_currency_id } = req.body;
        console.log(req.body);

        if (!base_currency || !reference_currency || !rate || !period) {
            return res.status(400).json({
                error: 'Base, referência, taxa e ano são obrigatórios'
            });
        }

        if (base_currency === reference_currency) {
            return res.status(400).json({
                error: 'Não é possível usar a mesma moeda'
            });
        }

        const year = Number(period);

        if (isNaN(year) || year < 2000) {
            return res.status(400).json({
                error: 'Ano inválido'
            });
        }

        const { rows } = await db.query(`
            INSERT INTO currency_rates
                (base_currency, reference_currency, period, rate, source, created_at, updated_at)
            VALUES ($1, $2, $3, $4, 'manual', NOW(), NOW())
            ON CONFLICT (base_currency, reference_currency, period)
            DO UPDATE SET
                rate = EXCLUDED.rate,
                updated_at = NOW()
            RETURNING id
        `, [base_currency, reference_currency, year, rate]);

        res.status(201).json({
            id: rows[0].id,
            message: 'Taxa cadastrada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao salvar taxa:', error);
        res.status(500).json({
            error: 'Erro ao salvar taxa'
        });
    }
}


// LISTAR PARES DE CÂMBIO DE UMA MOEDA
export async function getCurrencyPairs(req, res) {
    try {
        const currencyId = req.params.currencyId;

        const { rows } = await db.query(`
            SELECT 
                cr.id,
                cr.base_currency,
                cr.reference_currency,
                cr.period,
                cr.rate,
                c_from.code AS from_code,
                c_from.name AS from_name,
                c_from.symbol AS from_symbol, 
                c_to.code AS to_code,
                c_to.name AS to_name,
                c_to.symbol AS to_symbol,
                co_to.name AS to_country_name
            FROM currency_rates cr
            INNER JOIN currencies c_from 
                ON cr.base_currency = c_from.id
            INNER JOIN currencies c_to 
                ON cr.reference_currency = c_to.id
            LEFT JOIN countries co_to 
                ON c_to.id_country = co_to.id_country
            WHERE cr.base_currency = $1
            ORDER BY cr.period DESC, c_to.code
        `, [currencyId]);

        res.json(rows);

    } catch (error) {
        console.error('Erro ao buscar taxas:', error);
        res.status(500).json({ error: 'Erro ao buscar taxas de moedas' });
    }
}



// DELETAR PAR DE CÂMBIO
export async function deleteCurrencyPair(req, res) {
    try {
        const { id } = req.params;
        
        const [result] = await db.query(
            'UPDATE currency_pairs SET active = 0 WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Par não encontrado' });
        }
        
        res.json({ message: 'Par removido com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar par:', error);
        res.status(500).json({ error: 'Erro ao deletar par' });
    }
};

// CRIAR TAXA DE CÂMBIO
export async function createCurrencyRate(req, res) {
    try {
        const { pair_id, year, rate } = req.body;
        
        if (!pair_id || !year || !rate) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        
        const [existing] = await db.query(`
            SELECT id FROM currency_rates 
            WHERE pair_id = ? AND year = ? AND active = 1
        `, [pair_id, year]);
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Já existe uma taxa cadastrada para este ano' });
        }
        
        const [result] = await db.query(`
            INSERT INTO currency_rates (pair_id, year, rate, active, created_at)
            VALUES (?, ?, ?, 1, NOW())
        `, [pair_id, year, rate]);
        
        res.status(201).json({
            id: result.insertId,
            message: 'Taxa de câmbio cadastrada com sucesso!'
        });
    } catch (error) {
        console.error('Erro ao criar taxa:', error);
        res.status(500).json({ error: 'Erro ao cadastrar taxa de câmbio' });
    }
};

// LISTAR TAXAS DE CÂMBIO DE UM PAR
export async function getCurrencyRates(req, res) {
    try {
        const { pairId } = req.params;
        
        const [rates] = await db.query(`
            SELECT id, pair_id, year, rate, created_at
            FROM currency_rates
            WHERE pair_id = ? AND active = 1
            ORDER BY year DESC
        `, [pairId]);
        
        res.json(rates);
    } catch (error) {
        console.error('Erro ao buscar taxas:', error);
        res.status(500).json({ error: 'Erro ao buscar taxas de câmbio' });
    }
};

// ATUALIZAR TAXA DE CÂMBIO
export async function updateCurrencyRate(req, res) {
    try {
        const { id } = req.params;
        const { rate } = req.body;
        
        const [result] = await db.query(`
            UPDATE currency_rates 
            SET rate = ?
            WHERE id = ? AND active = 1
        `, [rate, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Taxa não encontrada' });
        }
        
        res.json({ message: 'Taxa atualizada com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar taxa:', error);
        res.status(500).json({ error: 'Erro ao atualizar taxa' });
    }
};

// DELETAR TAXA DE CÂMBIO
export async function deleteCurrencyRate(req, res) {
    try {
        const { id } = req.params;
        
        const [result] = await db.query(
            'UPDATE currency_rates SET active = 0 WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Taxa não encontrada' });
        }
        
        res.json({ message: 'Taxa removida com sucesso!' });
    } catch (error) {
        console.error('Erro ao deletar taxa:', error);
        res.status(500).json({ error: 'Erro ao deletar taxa' });
    }
};