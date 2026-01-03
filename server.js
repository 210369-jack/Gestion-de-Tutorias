const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// ============================
// 1. CONFIGURACIONES
// ============================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Sirve los archivos estáticos (HTML, CSS, JS) de la carpeta actual
app.use(express.static(__dirname)); 

// ============================
// 2. CONEXIÓN A MONGODB ATLAS
// ============================
const MONGO_URI = "mongodb+srv://210369_db_user:u2hlwE8pdoBPHPDN@cluster0.saliknv.mongodb.net/Gestion_Tutoria?appName=Cluster0";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a la Nube (Atlas)"))
  .catch(err => console.error("❌ Error conectando a la nube:", err));

// ============================
// 3. MODELO DE USUARIO
// ============================
const UsuarioSchema = new mongoose.Schema({
  email: String,    
  password: String,
  rol: String,
  nombres: String
}, { collection: 'Coordinador' }); // <--- ESTO ES LA CLAVE: Fuerza a usar la colección exacta

const Usuario = mongoose.model("Coordinador", UsuarioSchema);

// ============================
// 4. RUTAS
// ============================

// Ruta principal: Muestra el Login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Proceso de Login
app.post("/login", async (req, res) => {
  // "Seguro": Aceptamos 'correo' O 'email' por si acaso el HTML tiene uno u otro
  const emailIngresado = req.body.correo || req.body.email;
  const passwordIngresado = req.body.password;

  console.log(`Intentando login con: ${emailIngresado}`); // Para ver en los logs qué llega

  try {
    // Buscamos el usuario en la base de datos
    const usuario = await Usuario.findOne({ email: emailIngresado });

    if (!usuario) {
      console.log("Usuario no encontrado en la BD");
      return res.send("<script>alert('Usuario no encontrado'); window.location.href='/';</script>");
    }

    if (usuario.password !== passwordIngresado) {
      console.log("Contraseña incorrecta");
      return res.send("<script>alert('Contraseña incorrecta'); window.location.href='/';</script>");
    }

    // SI EL LOGIN ES EXITOSO:
    if (usuario.rol === "coordinador" || usuario.rol === "admin") {
      return res.redirect("/HU1.html"); 
    } else {
      return res.send("Rol no válido o sin permisos");
    }

  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).send("Error interno del servidor");
  }
});

// ============================
// 5. ENCENDER SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});