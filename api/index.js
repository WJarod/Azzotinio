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

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

app.get("/api/generate-video", async (req, res) => {
  try {
    const salary = parseFloat(req.query.salary);
    if (!salary) {
      return res.status(400).json({ error: "Invalid salary" });
    }

    const incomePerSecond = salary / (35 * 4.33 * 3600);  // Revenu par seconde
    const duration = 10;  // Durée de la vidéo en secondes

    // Génération du texte pour chaque seconde
    let textOverlay = '';
    for (let i = 0; i <= duration; i++) {
      const income = (incomePerSecond * i).toFixed(2);
      textOverlay += `/l_text:Arial_40_bold:Temps ${i}s - Revenu: ${income}€,co_rgb:ffffff,g_center,y_${50 + i * 50}/`;
    }

    // Génération de la vidéo avec Cloudinary
    const videoUrl = cloudinary.url('blank', {
      resource_type: 'video',
      transformation: [
        { width: 800, height: 400, crop: "pad", background: "black" },
        ...textOverlay.split('/').filter(Boolean).map(overlay => ({ overlay }))
      ]
    });

    res.json({ videoUrl });

  } catch (error) {
    console.error("Error generating video:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Exporter l'application Express pour Vercel
module.exports = app;