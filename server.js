// ============================
// 0. IMPORTS
// ============================
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
// 2. MODELO DE USUARIO
// ============================
const UsuarioSchema = new mongoose.Schema({
  email: { type: String, required: true },    
  password: { type: String, required: true },
  rol: { type: String, required: true },
  nombres: String
}, { collection: 'Coordinador' }); // Asegúrate de que esta colección exista en Atlas

const Usuario = mongoose.model("Usuario", UsuarioSchema, "Coordinador");

// ============================
// 3. CONEXIÓN A MONGODB ATLAS
// ============================
const MONGO_URI = "mongodb+srv://210369_db_user:u2hlwE8pdoBPHPDN@cluster0.saliknv.mongodb.net/Gestion_Tutoria?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Conectado a la Nube (Atlas)");

    // Probar si la colección tiene usuarios
    const usuarios = await Usuario.find();
    if (usuarios.length === 0) {
      console.warn("⚠️ No hay usuarios en la colección 'Coordinador'. Revisa que existan en Atlas.");
    } else {
      console.log("Usuarios existentes en la colección:", usuarios.map(u => u.email));
    }

  })
  .catch(err => console.error("❌ Error conectando a la nube:", err));

// ============================
// 4. RUTAS
// ============================

// Ruta principal: Muestra el Login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Proceso de Login
app.post("/login", async (req, res) => {
  const emailIngresado = req.body.correo || req.body.email;
  const passwordIngresado = req.body.password;

  console.log(`Intentando login con: ${emailIngresado}`);

  try {
    const usuario = await Usuario.findOne({ email: emailIngresado });

    if (!usuario) {
      console.log("Usuario NO encontrado en la colección 'Coordinador'");
      return res.send("<script>alert('Usuario no encontrado'); window.location.href='/';</script>");
    }

    if (usuario.password !== passwordIngresado) {
      console.log("Contraseña INCORRECTA");
      return res.send("<script>alert('Contraseña incorrecta'); window.location.href='/';</script>");
    }

    console.log(`Login exitoso: ${usuario.email} - Rol: ${usuario.rol}`);
    return usuario.rol === "coordinador" || usuario.rol === "admin"
      ? res.redirect("/HU1.html")
      : res.send("Rol no válido o sin permisos");

  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).send("Error interno del servidor");
  }
});

// ==========================================
// 1. MODELO PARA TODOS LOS USUARIOS (NUEVO)
// ==========================================
// Este esquema coincide con los campos de tu foto
const NuevoUsuarioSchema = new mongoose.Schema({
  nombreCompleto: String,
  email: String,
  tipoUsuario: String,  // Aquí se guardará si es Estudiante, Tutor, etc.
  matricula: String,
  fechaRegistro: { type: Date, default: Date.now } // Guardamos la fecha automáticamente
}, { collection: 'Usuarios_Sistema' }); // Se creará una carpeta nueva en Atlas

const NuevoUsuario = mongoose.model("NuevoUsuario", NuevoUsuarioSchema);

// ============================
// INSERTAR USUARIO DE PRUEBA
// ============================
async function crearUsuarioPrueba() {
  const existe = await Usuario.findOne({ email: "tutor@tutorias.com" });
  if (!existe) {
    await Usuario.create({
      nombres: "Coordinador General",
      email: "tutor@tutorias.com",
      password: "admin123",
      rol: "coordinador"
    });
    console.log("✅ Usuario de prueba creado en Atlas");
  } else {
    console.log("⚠️ Usuario de prueba ya existe");
  }
}

crearUsuarioPrueba();

// ==========================================
// 2. RUTA PARA GUARDAR LOS DATOS (POST)
// ==========================================
app.post("/registrar-usuario", async (req, res) => {
  try {
    // Creamos el usuario con los datos que llegan del formulario
    const usuario = new NuevoUsuario({
      nombreCompleto: req.body.nombre,      // Ojo a estos nombres, los usaremos en el HTML
      email: req.body.email,
      tipoUsuario: req.body.tipo,
      matricula: req.body.matricula
    });

    // Guardar en la Nube
    await usuario.save();
    
    console.log("✅ Usuario registrado:", usuario);
    
    // Al terminar, volvemos a la página anterior con un mensaje
    res.send("<script>alert('¡Usuario registrado con éxito!'); window.location.href='/HU1.html';</script>");

  } catch (error) {
    console.error("❌ Error al registrar:", error);
    res.send("<script>alert('Error al guardar los datos'); window.location.href='/HU1.html';</script>");
  }
});

// ============================
// 5. ENCENDER SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});


