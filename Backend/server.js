const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();
const PORT = 3000;

// MySQL Configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'srm_db',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create MySQL pool
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Test database connection
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
    return true;
  } catch (err) {
    console.error('❌ MySQL connection failed:', err);
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
    
    // Map form fields to database columns
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

    const [result] = await pool.query(
      `INSERT INTO supplier_evaluations SET ?`,
      evaluationData
    );
    
    res.json({ 
      success: true, 
      message: 'Evaluation submitted successfully',
      evaluationId: result.insertId
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
    const [rows] = await pool.query(`
      SELECT id, supplier_name, evaluation_month, total_score, created_at
      FROM supplier_evaluations
      ORDER BY created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: rows });
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
      console.log(`MySQL database: ${dbConfig.database} on port ${dbConfig.port}`);
    });
  } else {
    console.error('Failed to start server due to database connection issues');
    process.exit(1);
  }
}

startServer();