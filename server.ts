import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock ML Prediction Endpoint
  // In a real app, this would call a Python service or use a JS ML library
  app.post("/api/predict", (req, res) => {
    const data = req.body;
    const { diseaseType, age, bmi, glucose, bloodPressure, cholesterol, familyHistory } = data;
    
    let probability = 0.05;
    let medications: string[] = [];

    if (diseaseType === 'heart_disease') {
      if (age > 50) probability += 0.15;
      if (bloodPressure > 140) probability += 0.25;
      if (cholesterol > 240) probability += 0.2;
      if (familyHistory) probability += 0.15;
      if (bmi > 30) probability += 0.1;
      
      medications = ["Atorvastatin (Lipitor)", "Amlodipine (Norvasc)", "Lisinopril (Zestril)", "Aspirin (Low Dose)"];
    } else if (diseaseType === 'diabetes') {
      if (age > 45) probability += 0.1;
      if (glucose > 126) probability += 0.4;
      if (bmi > 25) probability += 0.25;
      if (familyHistory) probability += 0.15;
      
      medications = ["Metformin (Glucophage)", "Glipizide (Glucotrol)", "Sitagliptin (Januvia)", "Insulin (if advanced)"];
    } else if (diseaseType === 'breast_cancer') {
      if (age > 50) probability += 0.2;
      if (familyHistory) probability += 0.4;
      if (bmi > 30) probability += 0.1;
      
      medications = ["Tamoxifen (Soltamox)", "Anastrozole (Arimidex)", "Trastuzumab (Herceptin)", "Letrozole (Femara)"];
    }
    
    probability = Math.min(probability, 0.98);
    
    let riskLevel = "low";
    if (probability > 0.7) riskLevel = "high";
    else if (probability > 0.35) riskLevel = "moderate";
    
    res.json({
      probability,
      riskLevel,
      recommendation: probability > 0.35 
        ? `Based on your ${diseaseType.replace('_', ' ')} risk score, we strongly recommend scheduling a comprehensive screening with a specialist.` 
        : "Your indicators are within a healthy range. Continue regular check-ups and a balanced lifestyle.",
      medications: probability > 0.35 ? medications : [],
      modelUsed: "Gradient Boosted Trees (XGBoost)"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
