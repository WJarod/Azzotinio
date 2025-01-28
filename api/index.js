const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour utiliser EJS
app.set("view engine", "ejs");
app.use(express.static("public")); // Dossier pour les fichiers statiques

// Route principale
app.get("/", (req, res) => {
  res.render("index"); // On affichera l'interface avec EJS
});

// Route API pour le calcul du revenu
app.get("/api/calculate", (req, res) => {
  const salary = parseFloat(req.query.salary); // Récupère le salaire depuis les paramètres
  if (!salary) {
    return res.status(400).json({ error: "Invalid salary" });
  }
  const secondsPerMonth = 30 * 24 * 60 * 60; // Approximatif : 30 jours
  const incomePerSecond = salary / secondsPerMonth;

  res.json({ incomePerSecond });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});