const express = require("express");
const cors = require("cors");

require("dotenv").config();

const { connectDB } = require("./db");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DOA Backend API is running",
  });
});

// Passenger API
app.get("/api/passengers", async (req, res) => {
  try {
    const pool = await connectDB();

    const result = await pool.request().query(`
      SELECT
        TrnDate,
        AirlineName AS airline,
        AirportName AS airport,
        SUM(ISNULL(Passenger, 0)) AS totalPassenger
      FROM dbo.Aviation_2019AprToNow
      GROUP BY TrnDate, AirlineName, AirportName
      ORDER BY TrnDate DESC;
    `);

    res.json({
      success: true,
      rows: result.recordset,
    });
  } catch (error) {
    console.error("Passenger API error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
      rows: [],
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`DOA Backend running on port ${PORT}`);
});