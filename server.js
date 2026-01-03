const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors"); // Agregamos cors por seguridad

const app = express();

// ============================
// CONFIGURACIONES
// ============================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Esta línea permite que el servidor encuentre tus archivos HTML y CSS
// Asume que tus archivos están en la MISMA carpeta que server.js
app.use(express.static(__dirname)); 

// ============================
// CONEXIÓN A MONGODB (CORREGIDO)
// ============================
// Usamos tu base de datos REAL: 'Gestion_Tutoria'
mongoose.connect("mongodb://127.0.0.1:27017/Gestion_Tutoria")
  .then(() => console.log("✅ MongoDB conectado a Gestion_Tutoria"))
  .catch(err => console.log("❌ Error de conexión:", err));

// ============================
// MODELO DE USUARIO (CORREGIDO)
// ============================
// Usamos tu colección REAL: 'Coordinador'
const UsuarioSchema = new mongoose.Schema({
  email: String,    // Tu base de datos usa 'email', no 'correo'
  password: String,
  rol: String
}, { collection: 'Coordinador' }); // Forzamos a que busque en la colección exacta

const Usuario = mongoose.model("Coordinador", UsuarioSchema);

// ============================
// RUTA PRINCIPAL (LOGIN)
// ============================
app.get("/", (req, res) => {
  // Cuando entras a localhost:3000, te muestra el dashboard (login)
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// ============================
// PROCESO DE LOGIN
// ============================
app.post("/login", async (req, res) => {
  // Nota: Tu HTML debe enviar 'correo' y 'password'
  const { correo, password } = req.body;

  // Buscamos por email
  const usuario = await Usuario.findOne({ email: correo });

  if (!usuario) {
    return res.send("<script>alert('Usuario no encontrado'); window.location.href='/';</script>");
  }

  if (usuario.password !== password) {
    return res.send("<script>alert('Contraseña incorrecta'); window.location.href='/';</script>");
  }

  // REDIRECCIÓN (A tus archivos reales)
  // Como tu usuario Coordinador tiene rol "coordinador":
  if (usuario.rol === "coordinador" || usuario.rol === "admin") {
    return res.redirect("/HU1.html"); // Te manda a la HU2
  }

  res.send("Rol no válido o sin permisos");
});

// ============================
// SERVIDOR
// ============================
app.listen(3000, () => {
  console.log("🚀 Servidor activo en http://localhost:3000");
});