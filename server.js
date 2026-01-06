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
// 2. MODELOS DE BASE DE DATOS
// ============================

// --- MODELO COORDINADOR (LOGIN) ---
const UsuarioSchema = new mongoose.Schema({
  email: { type: String, required: true },    
  password: { type: String, required: true },
  rol: { type: String, required: true },
  nombres: String
}, { collection: 'Coordinador' }); 
const Usuario = mongoose.model("Usuario", UsuarioSchema, "Coordinador");

// --- MODELO HU1 Y HU3 (GESTIÓN DE USUARIOS - TU PARTE) ---
const NuevoUsuarioSchema = new mongoose.Schema({
  dni: String, // ¡Campo DNI agregado!
  nombreCompleto: String,
  email: String,
  tipoUsuario: String,  
  matricula: String,
  tutorActual: { type: String, default: "Sin Asignar" },
  fechaRegistro: { type: Date, default: Date.now } 
}, { collection: 'Usuarios_Sistema' });
const NuevoUsuario = mongoose.model("NuevoUsuario", NuevoUsuarioSchema);

// --- MODELOS DE COMPAÑEROS (HU7, ACTIVIDADES, SESIONES) ---
const RegistroTutoriaSchema = new mongoose.Schema({
  estudiante: {
    nombre: { type: String, default: "Ana Patricia Rodríguez López" },
    matricula: { type: String, default: "2021-0456789" },
    carrera: { type: String, default: "Ingeniería en Sistemas" }
  },
  bienestar: { estadoAnimo: String, nivelEstres: String, observaciones: String },
  participacion: { clase: String, asistencia: String, actividades: [String] },
  situacionPersonal: { familiar: String, economica: String, factoresRendimiento: String },
  seguimiento: { observacionesGenerales: String, derivaciones: [String], seguimientoRequerido: String },
  fechaRegistro: { type: Date, default: Date.now }
}, { collection: 'Registros_Tutorias' });
const RegistroTutoria = mongoose.model("RegistroTutoria", RegistroTutoriaSchema);

const ActividadProfesionalSchema = new mongoose.Schema({
    estudianteId: { type: String, default: "2021001234" },
    tipoActividad: String, descripcion: String, institucion: String,
    fechaInicio: Date, fechaFin: Date, observaciones: String,
    fechaRegistro: { type: Date, default: Date.now }
}, { collection: 'Actividades_Profesionales' });
const ActividadProfesional = mongoose.model("ActividadProfesional", ActividadProfesionalSchema);

const SesionTutoriaSchema = new mongoose.Schema({
  fecha: { type: Date, required: true },
  tutor: { type: String, required: true },
  estudiante_codigo: { type: String, required: true },
  estudiante_nombre: { type: String, required: true },
  grupo: { type: String, required: true },
  curso: { type: String, required: true },
  temas_tratados: { type: String, required: true },
  observaciones: String, recomendaciones: String, dificultades_detectadas: String,
  nivel_desempeno: { type: String, enum: ['Excelente', 'Bueno', 'Regular', 'Deficiente'], required: true },
  proxima_sesion: Date, archivo_adjunto: String, tipo_archivo: String,
  estado: { type: String, enum: ['Completada', 'Pendiente', 'Programada'], default: 'Completada' },
  fecha_creacion: { type: Date, default: Date.now }
}, { collection: 'Sesiones_Tutoria' });
const SesionTutoria = mongoose.model("SesionTutoria", SesionTutoriaSchema);


// ============================
// 3. CONEXIÓN A MONGODB ATLAS
// ============================
const MONGO_URI = "mongodb+srv://210369_db_user:u2hlwE8pdoBPHPDN@cluster0.saliknv.mongodb.net/Gestion_Tutoria?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(async () => { console.log("✅ Conectado a la Nube (Atlas)"); })
  .catch(err => console.error("❌ Error conectando a la nube:", err));


// ============================
// 4. RUTAS DEL SERVIDOR
// ============================

// --- RUTA PRINCIPAL Y LOGIN ---
app.get("/", (req, res) => { res.sendFile(path.join(__dirname, "dashboard.html")); });

app.post("/login", async (req, res) => {
  const emailIngresado = req.body.correo || req.body.email;
  const passwordIngresado = req.body.password;
  try {
    const usuario = await Usuario.findOne({ email: emailIngresado });
    if (!usuario) return res.send("<script>alert('Usuario no encontrado'); window.location.href='/';</script>");
    if (usuario.password !== passwordIngresado) return res.send("<script>alert('Contraseña incorrecta'); window.location.href='/';</script>");
    
    return usuario.rol === "coordinador" || usuario.rol === "admin"
      ? res.redirect("/HU1.html")
      : res.send("Rol no válido o sin permisos");
  } catch (error) {
    res.status(500).send("Error interno del servidor");
  }
});

// =========================================================
// RUTAS DE TU HU1 (GESTIÓN DE USUARIOS) - API REST CORRECTA
// =========================================================

// 1. GET: Cargar usuarios en la tabla
app.get('/api/usuarios', async (req, res) => {
    try {
        const usuarios = await NuevoUsuario.find();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: "Error al cargar usuarios" });
    }
});

// 2. POST: Guardar nuevo usuario (Desde el Modal)
app.post('/api/usuarios', async (req, res) => {
    try {
        const nuevoUsuario = new NuevoUsuario({
            dni: req.body.dni,
            nombreCompleto: req.body.nombreCompleto || req.body.nombre,
            email: req.body.email,
            matricula: req.body.matricula,
            tipoUsuario: req.body.tipoUsuario || req.body.tipo,
            tutorActual: "Sin Asignar"
        });
        await nuevoUsuario.save();
        res.status(201).json({ message: "Usuario creado exitosamente", usuario: nuevoUsuario });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: "Error al guardar usuario" });
    }
});

// 3. DELETE: Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        await NuevoUsuario.findByIdAndDelete(req.params.id);
        res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
});

// 4. PUT: Actualizar usuario (Para HU3 - Asignar Tutor)
app.put("/actualizar-usuario/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const datosActualizados = req.body; 
    const usuarioActualizado = await NuevoUsuario.findByIdAndUpdate(id, datosActualizados, { new: true });
    
    if (!usuarioActualizado) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    
    console.log("✅ Usuario actualizado (HU3):", usuarioActualizado);
    res.json({ success: true, message: "Actualización exitosa" });
  } catch (error) {
    console.error("❌ Error al actualizar:", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
});


// =========================================================
// RUTAS DE TUS COMPAÑEROS (HU7, ACTIVIDADES, SDK)
// =========================================================

app.post("/guardar-tutoria", async (req, res) => {
    try {
        const nuevaTutoria = new RegistroTutoria(req.body);
        const resultado = await nuevaTutoria.save(); 
        console.log("✅ Guardado en MongoDB con ID:", resultado._id);
        res.status(200).json({ mensaje: "Registro guardado exitosamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/guardar-actividad", async (req, res) => {
    try {
        const nuevaActividad = new ActividadProfesional(req.body);
        await nuevaActividad.save();
        res.status(200).json({ mensaje: "Éxito" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/obtener-actividades", async (req, res) => {
    try {
        const actividades = await ActividadProfesional.find().sort({ fechaInicio: -1 });
        res.status(200).json(actividades);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete("/eliminar-actividad/:id", async (req, res) => {
    try {
        const resultado = await ActividadProfesional.findByIdAndDelete(req.params.id);
        if (resultado) res.status(200).json({ mensaje: "Registro eliminado correctamente" });
        else res.status(404).json({ mensaje: "No se encontró el registro" });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- REPORTES Y SESIONES (COMPAÑEROS) ---
app.get("/sesiones", async (req, res) => {
  try {
    const sesiones = await SesionTutoria.find().sort({ fecha: -1 });
    const sesionesConId = sesiones.map(sesion => ({ ...sesion.toObject(), __backendId: sesion._id.toString() }));
    res.json(sesionesConId);
  } catch (error) { res.status(500).json({ error: "Error al obtener sesiones" }); }
});

app.get("/sesiones/estadisticas", async (req, res) => {
  try {
    const totalSesiones = await SesionTutoria.countDocuments();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const sesionesSemana = await SesionTutoria.countDocuments({ fecha: { $gte: startOfWeek } });
    const estudiantesAtendidos = await SesionTutoria.distinct('estudiante_codigo');
    const dificultadesDetectadas = await SesionTutoria.countDocuments({ dificultades_detectadas: { $exists: true, $ne: "" } });
    res.json({ total: totalSesiones, semana: sesionesSemana, estudiantes: estudiantesAtendidos.length, dificultades: dificultadesDetectadas });
  } catch (error) { res.status(500).json({ error: "Error al obtener estadísticas" }); }
});

app.post("/sesiones", async (req, res) => {
  try {
    const nuevaSesion = new SesionTutoria(req.body);
    await nuevaSesion.save();
    res.json({ isOk: true, value: { ...nuevaSesion.toObject(), __backendId: nuevaSesion._id.toString() } });
  } catch (error) { res.status(500).json({ isOk: false, error: "Error al crear sesión" }); }
});

app.put("/sesiones/:id", async (req, res) => {
  try {
    const sesionActualizada = await SesionTutoria.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sesionActualizada) return res.status(404).json({ isOk: false, error: "Sesión no encontrada" });
    res.json({ isOk: true, value: { ...sesionActualizada.toObject(), __backendId: sesionActualizada._id.toString() } });
  } catch (error) { res.status(500).json({ isOk: false, error: "Error al actualizar sesión" }); }
});

app.delete("/sesiones/:id", async (req, res) => {
  try {
    const sesionEliminada = await SesionTutoria.findByIdAndDelete(req.params.id);
    if (!sesionEliminada) return res.status(404).json({ isOk: false, error: "Sesión no encontrada" });
    res.json({ isOk: true, value: { ...sesionEliminada.toObject(), __backendId: sesionEliminada._id.toString() } });
  } catch (error) { res.status(500).json({ isOk: false, error: "Error al eliminar sesión" }); }
});

// --- SDK CONFIGURATION ---
app.use("/_sdk", express.static(path.join(__dirname, "_sdk")));
app.all("/_sdk/api", async (req, res) => {
  const { method, params } = req.body || req.query;
  try {
    switch (method) {
      case "init":
        const sesiones = await SesionTutoria.find().sort({ fecha: -1 });
        const sesionesConId = sesiones.map(sesion => ({ ...sesion.toObject(), __backendId: sesion._id.toString() }));
        res.json({ isOk: true, value: sesionesConId });
        break;
      case "create":
        const nuevaSesion = new SesionTutoria(params);
        await nuevaSesion.save();
        res.json({ isOk: true, value: { ...nuevaSesion.toObject(), __backendId: nuevaSesion._id.toString() } });
        break;
      case "update":
        const { __backendId, ...datosActualizar } = params;
        const sesionActualizada = await SesionTutoria.findByIdAndUpdate(__backendId, datosActualizar, { new: true });
        if (!sesionActualizada) return res.json({ isOk: false, error: "Sesión no encontrada" });
        res.json({ isOk: true, value: { ...sesionActualizada.toObject(), __backendId: sesionActualizada._id.toString() } });
        break;
      case "delete":
        const sesionEliminada = await SesionTutoria.findByIdAndDelete(params.__backendId);
        if (!sesionEliminada) return res.json({ isOk: false, error: "Sesión no encontrada" });
        res.json({ isOk: true, value: { ...sesionEliminada.toObject(), __backendId: sesionEliminada._id.toString() } });
        break;
      default: res.json({ isOk: false, error: "Método no soportado" });
    }
  } catch (error) { res.json({ isOk: false, error: error.message }); }
});

// ============================
// 5. ENCENDER SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});