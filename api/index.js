const express = require("express");
const app = express();
const path = require("path");
const fs = require('fs');

// Configurer EJS pour les vues
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views")); // Indiquer où se trouvent les vues

// Middleware pour les fichiers statiques
app.use(express.static(path.join(__dirname, "../public"))); // Gérer les fichiers CSS, JS, images, etc.

require('dotenv').config();
const { Mux } = require('@mux/mux-node');

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

const Video = muxClient.video;

console.log('MUX_TOKEN_ID:', process.env.MUX_TOKEN_ID);
console.log('MUX_TOKEN_SECRET:', process.env.MUX_TOKEN_SECRET);

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

    const incomePerSecond = salary / (35 * 4.33 * 3600);
    const duration = 10;

    // Vérifier si l'objet Video est bien initialisé
    console.log('Video Object:', Video);

    // Créer un asset vidéo sur Mux
    const asset = await Video.Assets.create({
      input: "https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4",
      playback_policy: 'public'
    });

    const playbackUrl = `https://stream.mux.com/${asset.playback_ids[0].id}.mp4`;

    res.json({ videoUrl: playbackUrl });

  } catch (error) {
    console.error("Error generating video:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Exporter l'application Express pour Vercel
module.exports = app;