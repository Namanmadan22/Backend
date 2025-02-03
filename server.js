const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration to allow your frontend's origin
const corsOptions = {
  origin: 'https://frontend-jci9.onrender.com',  // Replace with your actual frontend Render URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};

// Middleware
app.use(bodyParser.json());
app.use(cors(corsOptions));

// MySQL connection pool
const db = mysql.createPool({
  host: 'my-database.c1yc8mu0ywjc.ap-south-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Namanmadan.22',  // Secure it using environment variables
  database: 'form_data',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// POST route for submitting penalty data
app.post('/submit-penalty', (req, res) => {
  const penaltyData = req.body;

  penaltyData.forEach(entry => {
    const { project, slaBreach, penaltyAmount, issues } = entry;

    let totalCases = issues.reduce((sum, issue) => sum + issue.caseCount, 0);
    let perCasePenalty = totalCases ? penaltyAmount / totalCases : 0;

    issues.forEach(issue => {
      const { issueType, caseCount } = issue;
      const issuePenalty = perCasePenalty * caseCount;

      const sql = `
        INSERT INTO penalty_calculations 
        (project, sla_breach, issue_type, case_count, penalty_per_case, total_penalty) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [project, slaBreach, issueType, caseCount, perCasePenalty, issuePenalty];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error('Error inserting penalty data:', err);
          res.status(500).json({ message: 'Error inserting penalty data.' });
          return;  // Stop further execution on error
        }
      });
    });
  });

  res.json({ message: 'Penalty data submitted successfully.' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
