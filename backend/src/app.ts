import cors from "cors";
import express from "express";
import fs from "node:fs";
import morgan from "morgan";
import path from "node:path";

// Detect environment
const NODE_ENV = process.env.NODE_ENV || "development";
console.log("🌱 Environment:", NODE_ENV);

// Path to frontend build
const frontendDistPath = path.join(__dirname, NODE_ENV === "production"
	? "../../../frontend/dist"
	: "../../frontend/dist"
);

// Fire up a new express application
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Check if frontend build exists
if (fs.existsSync(frontendDistPath)) {
	console.log("🚚 Path to frontend build:", frontendDistPath);
	// Serve frontend
	app.use(express.static(frontendDistPath));
} else {
	console.warn("🔔 Path to frontend build does not exist:", frontendDistPath);

	// Catch-all route handler with message about missing frontend build
	app.use((_req, res) => {
		// Respond with 404 and a message in JSON-format
		res.status(404).send(`Frontend build does not exist at ${frontendDistPath}`);
	});
}

export default app;
