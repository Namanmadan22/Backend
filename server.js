// Import necessary packages
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

// Initialize Express app
const app = express();
// Use the environment variable for port or fallback to 3001 locally
const port = process.env.PORT || 3001;  // Render will use the dynamic port

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Create a connection pool for better connection handling
const db = mysql.createPool({
  host: 'mysql.railway.internal',  // In production, use the actual database host
  user: 'root',
  password: 'nwNalIXegjVnGzEdPRwhuxzNumvqJqyP',  // Consider using environment variables for sensitive info
  database: 'railway',
  waitForConnections: true,
  connectionLimit: 10,  // Adjust this value as needed
  queueLimit: 0
});

// Route to handle SLA penalties submission
app.post('/submit-penalty', (req, res) => {
  const penaltyData = req.body;

  penaltyData.forEach(entry => {
    const { project, slaBreach, penaltyAmount, issues } = entry;

    // Loop through each issue and calculate penalty
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
