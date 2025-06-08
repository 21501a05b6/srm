const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const PORT = 3000;

// PostgreSQL Configuration
const dbConfig = {
  host: 'localhost',
  user: 'postgres',
  password: 'postgres', // change to your PostgreSQL password
  database: 'srm_db',
  port: 5432,
  max: 10, // maximum number of clients in the pool
  idleTimeoutMillis: 30000
};

// Create PostgreSQL pool
const pool = new Pool(dbConfig);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
    return true;
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err);
    return false;
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.post('/api/evaluations', async (req, res) => {
  try {
    const formData = req.body.data;
    
    const evaluationData = {
      category: formData.category,
      sub_category: formData.subCategory,
      supplier_name: formData.supplierName,
      evaluation_month: formData.month,
      portfolio_diversity: parseFloat(formData.portfolio_diversity) || 0,
      credit_term: parseFloat(formData.credit_term) || 0,
      capacity_utilisation: parseFloat(formData.capacity_utilisation) || 0,
      strategic_partnership: parseFloat(formData.strategic_partnership) || 0,
      business_etiquette: parseFloat(formData.business_etiquette) || 0,
      inventory_carrying: parseFloat(formData.inventory_carrying) || 0,
      advance_notice: parseFloat(formData.advance_notice) || 0,
      knowledge_sharing: parseFloat(formData.knowledge_sharing) || 0,
      legal_contracts: parseFloat(formData.legal_contracts) || 0,
      cost_competitiveness: parseFloat(formData.cost_competitiveness) || 0,
      cost_model: parseFloat(formData.cost_model) || 0,
      sdp_rating: parseFloat(formData.sdp_rating) || 0,
      quality_glo: parseFloat(formData.quality_glo) || 0,
      quality_gsqa_ing: parseFloat(formData.quality_gsqa_ing) || 0,
      sc_notification: parseInt(formData.sc_notification) || 0,
      supplier_audit: parseInt(formData.supplier_audit) || 0
    };

    const query = `
      INSERT INTO supplier_evaluations (
        category, sub_category, supplier_name, evaluation_month,
        portfolio_diversity, credit_term, capacity_utilisation,
        strategic_partnership, business_etiquette, inventory_carrying,
        advance_notice, knowledge_sharing, legal_contracts,
        cost_competitiveness, cost_model, sdp_rating,
        quality_glo, quality_gsqa_ing, sc_notification, supplier_audit
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING id
    `;

    const values = Object.values(evaluationData);

    const result = await pool.query(query, values);

    res.json({ 
      success: true, 
      message: 'Evaluation submitted successfully',
      evaluationId: result.rows[0].id
    });
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save evaluation',
      error: err.message
    });
  }
});

app.get('/api/evaluations', async (req, res) => {
  try {
    const query = `
      SELECT id, supplier_name, evaluation_month, total_score, created_at
      FROM supplier_evaluations
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Database Error:', err);
    res.status(500).json({ success: false, message: 'Failed to load evaluations' });
  }
});

// Start Server
async function startServer() {
  if (await testConnection()) {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`PostgreSQL database: ${dbConfig.database} on port ${dbConfig.port}`);
    });
  } else {
    console.error('Failed to start server due to database connection issues');
    process.exit(1);
  }
}

startServer();
