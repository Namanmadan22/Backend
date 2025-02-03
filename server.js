// Import necessary packages
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');

// Initialize Express app
const app = express();
// Use the environment variable for port or fallback to 3001 locally
const port = process.env.PORT || 3001;  // Render will use the dynamic port

// CORS Configuration: Allow frontend to make requests from specific origin
app.use(cors({
  origin: 'https://namanmadan22.github.io/Frontend/',  // Replace with your actual frontend URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Create a connection pool for better connection handling
const db = mysql.createPool({
  host: 'mysql.railway.internal',  // In production, use the actual database host
  user: 'root',
  password: 'nwNalIXegjVnGzEdPRwhuxzNumvqJqyP',  // Consider using environment variables for sensitive info
  database: 'railway',
  waitForConnections: true,
  connectionLimit: 10,  // Adjust this value as needed
  queueLimit: 0,
});

// Route to handle SLA penalties submission
app.post('/submit-penalty', (req, res) => {
  const penaltyData = req.body;

  // Iterate over the submitted data
  penaltyData.forEach(entry => {
    const { project, slaBreach, penaltyAmount, issues } = entry;

    // Calculate total cases and penalty per case
    let totalCases = issues.reduce((sum, issue) => sum + issue.caseCount, 0);
    let perCasePenalty = totalCases ? penaltyAmount / totalCases : 0;

    // Process each issue and calculate the penalty
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

  // Respond with a success message once all data is processed
  res.json({ message: 'Penalty data submitted successfully.' });
});

// Simple route to check if backend is running
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
