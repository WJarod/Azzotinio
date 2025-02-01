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

    const incomePerSecond = salary / (35 * 4.33 * 3600);  
    const duration = 10;  

    const imageUrls = [];

    for (let i = 0; i <= duration; i++) {
      const income = (incomePerSecond * i).toFixed(2);
      const text = `Temps : ${i}s - Revenu : ${income}€`;

      // Génération d'une image sur Cloudinary
      const result = await cloudinary.uploader.upload(
        "https://res.cloudinary.com/demo/image/upload/black.jpg", {
          transformation: [
            { width: 800, height: 400, crop: "pad", background: "black" },
            { overlay: { font_family: "Arial", font_size: 40, text: text }, gravity: "center", color: "white" }
          ]
        }
      );

      imageUrls.push(result.secure_url);
    }

    // Créer l'Asset vidéo sur Mux avec les images
    const asset = await Video.Assets.create({
      input: imageUrls,
      playback_policy: 'public'
    });

    // Attendre que la vidéo soit prête
    const playbackUrl = `https://stream.mux.com/${asset.playback_ids[0].id}.mp4`;

    res.json({ videoUrl: playbackUrl });

  } catch (error) {
    console.error("Error generating video:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Exporter l'application Express pour Vercel
module.exports = app;