import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";


dotenv.config();

const app = express();

app.use(express.json());  // Middleware to parse JSON bodies
app.use(cookieParser());  // Middleware to parse cookies

app.get("/", (req, res) => {
    res.send("Hello Guys welcome to leetlab 🔥");
});

app.use("/api/v1/auth/", authRoutes);  // Authentication routes
// app.use("/api/v1", );
// Use dynamic port or default to 8080
app.listen(process.env.PORT || 8000, () => {
    console.log(`Server is listening on port ${process.env.PORT || 8080}`);
});
