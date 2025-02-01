const express = require("express");
const app = express();
const path = require("path");
const { createCanvas } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

// Configurer EJS pour les vues
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views")); // Indiquer où se trouvent les vues

// Middleware pour les fichiers statiques
app.use(express.static(path.join(__dirname, "../public"))); // Gérer les fichiers CSS, JS, images, etc.

// Route principale
app.get("/", (req, res) => {
  try {
    res.render("index"); // Affiche la page EJS
  } catch (error) {
    console.error("Error rendering index page: ", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route API pour le calcul du revenu
app.get("/api/calculate", (req, res) => {
  try {
    const salary = parseFloat(req.query.salary);
    if (!salary) {
      return res.status(400).json({ error: "Invalid salary" });
    }

    const hoursPerWeek = 35;
    const weeksPerMonth = 4.33;
    const secondsPerHour = 3600;

    const totalSecondsPerMonth = hoursPerWeek * weeksPerMonth * secondsPerHour;
    const incomePerSecond = salary / totalSecondsPerMonth;

    res.json({ incomePerSecond });
  } catch (error) {
    console.error("Error calculating income: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route pour générer une vidéo de décompte des revenus
app.get("/api/generate-video", async (req, res) => {
  try {
    const salary = parseFloat(req.query.salary);
    if (!salary) {
      return res.status(400).json({ error: "Invalid salary" });
    }

    const incomePerSecond = salary / (35 * 4.33 * 3600);
    const duration = 10; // Durée de la vidéo en secondes

    const framesDir = path.join(__dirname, '../frames');
    if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

    // Générer les images pour chaque seconde
    for (let i = 0; i <= duration; i++) {
      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'white';
      ctx.font = '40px Arial';
      ctx.fillText(`Temps : ${i}s`, 50, 150);
      ctx.fillText(`Revenu : ${(incomePerSecond * i).toFixed(2)} €`, 50, 250);

      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(path.join(framesDir, `frame${i}.png`), buffer);
    }

    const outputPath = path.join(__dirname, '../public', 'income_video.mp4');
    ffmpeg()
      .input(path.join(framesDir, 'frame%d.png'))
      .inputFPS(1)
      .outputFPS(25)
      .output(outputPath)
      .on('end', () => {
        fs.rmSync(framesDir, { recursive: true, force: true });
        res.download(outputPath); 
      })
      .run();

  } catch (error) {
    console.error("Error generating video: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Exporter l'application Express pour Vercel
module.exports = app;