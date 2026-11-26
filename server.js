
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();

app.use(express.json());

// Serve frontend files from public folder
app.use(express.static(path.join(__dirname, "public")));

// Connect to MySQL using environment variables
console.log("Database host:", process.env.MYSQLHOST);
console.log("Database port:", process.env.MYSQLPORT);
console.log("Database name:", process.env.MYSQLDATABASE);
const db = mysql.createPool({
    //host: process.env.MYSQLHOST,
    host: process.env.MYSQLHOST || "127.0.0.1",
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    waitForConnections: true,
    connectionLimit: 10
});

// Create table automatically if it does not exist
async function initializeDatabase() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL,
            mobile VARCHAR(15) NOT NULL,
            college VARCHAR(150) NOT NULL,
            course VARCHAR(100) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("MySQL table is ready");
}

// API to register a student
app.post("/api/students", async (req, res) => {
    try {
        const {
            student_name,
            email,
            mobile,
            college,
            course
        } = req.body;

        // Check that all fields are filled
        if (
            !student_name ||
            !email ||
            !mobile ||
            !college ||
            !course
        ) {
            return res.status(400).json({
                message: "Please fill in all fields."
            });
        }

        // Insert student into MySQL
        const sql = `
            INSERT INTO students
            (student_name, email, mobile, college, course)
            VALUES (?, ?, ?, ?, ?)
        `;

        const values = [
            student_name.trim(),
            email.trim(),
            mobile.trim(),
            college.trim(),
            course.trim()
        ];

        const [result] = await db.execute(sql, values);

        res.status(201).json({
            message: "Registration successful!",
            studentId: result.insertId
        });

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Registration failed. Please try again."
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initializeDatabase();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Could not connect to MySQL:", error);
        process.exit(1);
    }
}

startServer();
