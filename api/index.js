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
const Mux = require('@mux/mux-node');

const { Video } = new Mux({
  accessToken: process.env.MUX_ACCESS_TOKEN,
  secret: process.env.MUX_SECRET_KEY
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

    // Génération d'un fichier texte décrivant la vidéo
    const videoScript = Array.from({ length: duration + 1 }, (_, i) => {
      const income = (incomePerSecond * i).toFixed(2);
      return `Temps: ${i}s - Revenu: ${income}€`;
    }).join('\n');

    // Créer un asset vidéo vide sur Mux
    const asset = await Video.Assets.create({
      input: "https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4",
      playback_policy: 'public'
    });

    // Générer le lien de lecture
    const playbackUrl = `https://stream.mux.com/${asset.playback_ids[0].id}.mp4`;

    res.json({ videoUrl: playbackUrl });

  } catch (error) {
    console.error("Error generating video:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Exporter l'application Express pour Vercel
module.exports = app;