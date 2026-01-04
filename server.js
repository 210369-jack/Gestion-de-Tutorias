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
// 2. MODELOS
// ============================

// MODELO DE COORDINADOR (LOGIN)
const UsuarioSchema = new mongoose.Schema({
  email: { type: String, required: true },    
  password: { type: String, required: true },
  rol: { type: String, required: true },
  nombres: String
}, { collection: 'Coordinador' }); 

const Usuario = mongoose.model("Usuario", UsuarioSchema, "Coordinador");

// MODELO PARA REGISTROS DE TUTORÍA (HU7 - Trabajo de compañeros)
const RegistroTutoriaSchema = new mongoose.Schema({
  estudiante: {
    nombre: { type: String, default: "Ana Patricia Rodríguez López" },
    matricula: { type: String, default: "2021-0456789" },
    carrera: { type: String, default: "Ingeniería en Sistemas" }
  },
  bienestar: {
    estadoAnimo: String,
    nivelEstres: String,
    observaciones: String
  },
  participacion: {
    clase: String,
    asistencia: String,
    actividades: [String] 
  },
  situacionPersonal: {
    familiar: String,
    economica: String,
    factoresRendimiento: String
  },
  seguimiento: {
    observacionesGenerales: String,
    derivaciones: [String], 
    seguimientoRequerido: String
  },
  fechaRegistro: { type: Date, default: Date.now }
}, { collection: 'Registros_Tutorias' });

const RegistroTutoria = mongoose.model("RegistroTutoria", RegistroTutoriaSchema);

// MODELO PARA GESTIÓN DE USUARIOS (HU1 - Tu trabajo)
const NuevoUsuarioSchema = new mongoose.Schema({
  nombreCompleto: String,
  email: String,
  tipoUsuario: String,  
  matricula: String,
  fechaRegistro: { type: Date, default: Date.now } 
}, { collection: 'Usuarios_Sistema' });

const NuevoUsuario = mongoose.model("NuevoUsuario", NuevoUsuarioSchema);

// ============================
// 3. CONEXIÓN A MONGODB ATLAS
// ============================
const MONGO_URI = "mongodb+srv://210369_db_user:u2hlwE8pdoBPHPDN@cluster0.saliknv.mongodb.net/Gestion_Tutoria?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Conectado a la Nube (Atlas)");
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
      return res.send("<script>alert('Usuario no encontrado'); window.location.href='/';</script>");
    }

    if (usuario.password !== passwordIngresado) {
      return res.send("<script>alert('Contraseña incorrecta'); window.location.href='/';</script>");
    }

    return usuario.rol === "coordinador" || usuario.rol === "admin"
      ? res.redirect("/HU1.html")
      : res.send("Rol no válido o sin permisos");

  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).send("Error interno del servidor");
  }
});

// RUTA PARA GUARDAR NUEVOS USUARIOS (HU1)
app.post("/registrar-usuario", async (req, res) => {
  try {
    const usuario = new NuevoUsuario({
      nombreCompleto: req.body.nombre,      
      email: req.body.email,
      tipoUsuario: req.body.tipo,
      matricula: req.body.matricula
    });
    await usuario.save();
    console.log("✅ Usuario registrado:", usuario);
    res.send("<script>alert('¡Usuario registrado con éxito!'); window.location.href='/HU1.html';</script>");
  } catch (error) {
    console.error("❌ Error al registrar:", error);
    res.send("<script>alert('Error al guardar los datos'); window.location.href='/HU1.html';</script>");
  }
});

// RUTA PARA OBTENER TODOS LOS USUARIOS (GET - HU1)
app.get("/obtener-usuarios", async (req, res) => {
  try {
    const usuarios = await NuevoUsuario.find(); 
    res.json(usuarios); 
  } catch (error) {
    res.status(500).send("Error al obtener usuarios");
  }
});

// RUTA PARA ELIMINAR USUARIO (DELETE - HU1)
app.delete("/eliminar-usuario/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await NuevoUsuario.findByIdAndDelete(id); 
    res.json({ success: true, message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error al eliminar" });
  }
});

// RUTA PARA GUARDAR TUTORÍA (HU7 - COMPAÑEROS)
app.post("/guardar-tutoria", async (req, res) => {
  try {
    const nuevaTutoria = new RegistroTutoria({
      bienestar: {
        estadoAnimo: req.body.estado_animo,
        nivelEstres: req.body.nivel_estres,
        observaciones: req.body.obs_bienestar
      },
      participacion: {
        clase: req.body.participacion_clase,
        asistencia: req.body.asistencia_tutorias,
        actividades: req.body.actividades || [] 
      },
      situacionPersonal: {
        familiar: req.body.sit_familiar,
        economica: req.body.sit_economica,
        factoresRendimiento: req.body.factores_rendimiento
      },
      seguimiento: {
        observacionesGenerales: req.body.obs_generales,
        derivaciones: req.body.derivaciones || [],
        seguimientoRequerido: req.body.seguimiento_req
      }
    });

    await nuevaTutoria.save();
    console.log("✅ Registro de tutoría guardado correctamente");
    res.send("<script>alert('Registro guardado con éxito en la nube'); window.location.href='/HU7.html';</script>");

  } catch (error) {
    console.error("❌ Error al guardar tutoría:", error);
    res.status(500).send("Error interno al procesar el registro");
  }
});

// ============================
// 5. ENCENDER SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});