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
  rol: { 
    type: String, 
    required: true,
    enum: ['admin', 'tutor', 'verificador'] // Solo estos 3 roles
  },
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
    actividades: [String] // Array para múltiples checkboxes
  },
  situacionPersonal: {
    familiar: String,
    economica: String,
    factoresRendimiento: String
  },
  seguimiento: {
    observacionesGenerales: String,
    derivaciones: [String], // Array para múltiples checkboxes
    seguimientoRequerido: String
  },
  fechaRegistro: { type: Date, default: Date.now }
}, { collection: 'Registros_Tutorias' });

const RegistroTutoria = mongoose.model("RegistroTutoria", RegistroTutoriaSchema);
const ActividadProfesionalSchema = new mongoose.Schema({
    estudianteId: { type: String, default: "2021001234" },
    tipoActividad: String,
    descripcion: String,
    institucion: String,
    fechaInicio: Date,
    fechaFin: Date,
    observaciones: String,
    fechaRegistro: { type: Date, default: Date.now }
}, { collection: 'Actividades_Profesionales' });

const ActividadProfesional = mongoose.model("ActividadProfesional", ActividadProfesionalSchema);

// MODELO PARA GESTIÓN DE USUARIOS (HU1 y HU3 - Tu trabajo)
// *** CAMBIO AQUÍ: Se agregó tutorActual ***
const NuevoUsuarioSchema = new mongoose.Schema({
  nombreCompleto: String,
  email: String,
  tipoUsuario: String,  
  matricula: String,
  tutorActual: { type: String, default: "Sin Asignar" }, // <--- NUEVO CAMPO PARA HU3
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
      matricula: req.body.matricula,
      tutorActual: "Sin Asignar" // Inicializamos como sin asignar
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

app.put("/actualizar-usuario/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const datosActualizados = req.body; 
    const usuarioActualizado = await NuevoUsuario.findByIdAndUpdate(id, datosActualizados, { new: true });
    
    if (!usuarioActualizado) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    
    console.log("✅ Usuario actualizado:", usuarioActualizado);
    res.json({ success: true, message: "Actualización exitosa" });
  } catch (error) {
    console.error("❌ Error al actualizar:", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
});

// ==========================================
// RUTA PARA ACTUALIZAR USUARIO (PUT) - HU3
// ==========================================
// Esta es la ruta nueva que permite "Reasignar" y "Modificar"
app.put("/actualizar-usuario/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const datosActualizados = req.body; 

    // Busca por ID y actualiza
    const usuarioActualizado = await NuevoUsuario.findByIdAndUpdate(id, datosActualizados, { new: true });

    if (!usuarioActualizado) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }

    console.log("✅ Usuario actualizado (HU3):", usuarioActualizado);
    res.json({ success: true, message: "Actualización exitosa" });

  } catch (error) {
    console.error("❌ Error al actualizar:", error);
    res.status(500).json({ success: false, message: "Error interno" });
  }
});

// ==========================================
// RUTA PARA GUARDAR TUTORÍA
// ==========================================
app.post("/guardar-tutoria", async (req, res) => {
    try {
        console.log("Datos recibidos:", req.body);

        // Creamos el registro con el esquema que definiste
        const nuevaTutoria = new RegistroTutoria(req.body);

        // GUARDADO: Esta es la línea clave
        const resultado = await nuevaTutoria.save(); 
        
        console.log("✅ Guardado en MongoDB con ID:", resultado._id);
        res.status(200).json({ mensaje: "Registro guardado exitosamente" });
    } catch (error) {
        console.error("❌ Error al guardar:", error);
        res.status(500).json({ error: error.message });
    }
});
app.post("/guardar-actividad", async (req, res) => {
    try {
        const nuevaActividad = new ActividadProfesional(req.body);
        await nuevaActividad.save();
        console.log("✅ Actividad Profesional guardada");
        res.status(200).json({ mensaje: "Éxito" });
    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/obtener-actividades", async (req, res) => {
    try {
        // Buscamos todas las actividades y las ordenamos por fecha de inicio (más reciente primero)
        const actividades = await ActividadProfesional.find().sort({ fechaInicio: -1 });
        res.status(200).json(actividades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete("/eliminar-actividad/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const resultado = await ActividadProfesional.findByIdAndDelete(id);
        
        if (resultado) {
            console.log(`🗑️ Actividad ${id} eliminada`);
            res.status(200).json({ mensaje: "Registro eliminado correctamente" });
        } else {
            res.status(404).json({ mensaje: "No se encontró el registro" });
        }
    } catch (error) {
        console.error("❌ Error al eliminar:", error);
        res.status(500).json({ error: error.message });
    }
});

// ============================
// MODELO PARA SESIONES DE TUTORÍA (Nuevo para Reportes)
// ============================
const SesionTutoriaSchema = new mongoose.Schema({
  fecha: { type: Date, required: true },
  tutor: { type: String, required: true },
  estudiante_codigo: { type: String, required: true },
  estudiante_nombre: { type: String, required: true },
  grupo: { type: String, required: true },
  curso: { type: String, required: true },
  temas_tratados: { type: String, required: true },
  observaciones: String,
  recomendaciones: String,
  dificultades_detectadas: String,
  nivel_desempeno: { 
    type: String, 
    enum: ['Excelente', 'Bueno', 'Regular', 'Deficiente'],
    required: true 
  },
  proxima_sesion: Date,
  archivo_adjunto: String,
  tipo_archivo: String,
  estado: { 
    type: String, 
    enum: ['Completada', 'Pendiente', 'Programada'],
    default: 'Completada'
  },
  fecha_creacion: { type: Date, default: Date.now }
}, { collection: 'Sesiones_Tutoria' });

const SesionTutoria = mongoose.model("SesionTutoria", SesionTutoriaSchema);

// ============================
// RUTAS PARA SESIONES DE TUTORÍA (Reportes)
// ============================

// RUTA PARA OBTENER TODAS LAS SESIONES
app.get("/sesiones", async (req, res) => {
  try {
    const sesiones = await SesionTutoria.find().sort({ fecha: -1 });
    // Agregar el ID del backend para compatibilidad con dataSdk
    const sesionesConId = sesiones.map(sesion => ({
      ...sesion.toObject(),
      __backendId: sesion._id.toString()
    }));
    res.json(sesionesConId);
  } catch (error) {
    console.error("❌ Error al obtener sesiones:", error);
    res.status(500).json({ error: "Error al obtener sesiones" });
  }
});

// RUTA PARA OBTENER ESTADÍSTICAS
app.get("/sesiones/estadisticas", async (req, res) => {
  try {
    const totalSesiones = await SesionTutoria.countDocuments();
    
    // Sesiones de esta semana
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const sesionesSemana = await SesionTutoria.countDocuments({
      fecha: { $gte: startOfWeek }
    });
    
    // Estudiantes únicos atendidos
    const estudiantesAtendidos = await SesionTutoria.distinct('estudiante_codigo');
    
    // Dificultades detectadas (sesiones con dificultades)
    const dificultadesDetectadas = await SesionTutoria.countDocuments({
      dificultades_detectadas: { $exists: true, $ne: "" }
    });
    
    res.json({
      total: totalSesiones,
      semana: sesionesSemana,
      estudiantes: estudiantesAtendidos.length,
      dificultades: dificultadesDetectadas
    });
  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// RUTA PARA CREAR NUEVA SESIÓN
app.post("/sesiones", async (req, res) => {
  try {
    const nuevaSesion = new SesionTutoria(req.body);
    await nuevaSesion.save();
    
    res.json({
      isOk: true,
      value: {
        ...nuevaSesion.toObject(),
        __backendId: nuevaSesion._id.toString()
      }
    });
  } catch (error) {
    console.error("❌ Error al crear sesión:", error);
    res.status(500).json({ 
      isOk: false, 
      error: "Error al crear sesión" 
    });
  }
});

// RUTA PARA ACTUALIZAR SESIÓN
app.put("/sesiones/:id", async (req, res) => {
  try {
    const sesionActualizada = await SesionTutoria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!sesionActualizada) {
      return res.status(404).json({ 
        isOk: false, 
        error: "Sesión no encontrada" 
      });
    }
    
    res.json({
      isOk: true,
      value: {
        ...sesionActualizada.toObject(),
        __backendId: sesionActualizada._id.toString()
      }
    });
  } catch (error) {
    console.error("❌ Error al actualizar sesión:", error);
    res.status(500).json({ 
      isOk: false, 
      error: "Error al actualizar sesión" 
    });
  }
});

// RUTA PARA ELIMINAR SESIÓN
app.delete("/sesiones/:id", async (req, res) => {
  try {
    const sesionEliminada = await SesionTutoria.findByIdAndDelete(req.params.id);
    
    if (!sesionEliminada) {
      return res.status(404).json({ 
        isOk: false, 
        error: "Sesión no encontrada" 
      });
    }
    
    res.json({
      isOk: true,
      value: {
        ...sesionEliminada.toObject(),
        __backendId: sesionEliminada._id.toString()
      }
    });
  } catch (error) {
    console.error("❌ Error al eliminar sesión:", error);
    res.status(500).json({ 
      isOk: false, 
      error: "Error al eliminar sesión" 
    });
  }
});

// ============================
// CONFIGURACIÓN PARA dataSdk (SDK de Your Virtual Butler)
// ============================

app.use("/_sdk", express.static(path.join(__dirname, "_sdk")));

// Endpoint para dataSdk
app.all("/_sdk/api", async (req, res) => {
  const { method, params } = req.body || req.query;
  
  try {
    switch (method) {
      case "init":
        // Simular inicialización
        const sesiones = await SesionTutoria.find().sort({ fecha: -1 });
        const sesionesConId = sesiones.map(sesion => ({
          ...sesion.toObject(),
          __backendId: sesion._id.toString()
        }));
        
        res.json({
          isOk: true,
          value: sesionesConId
        });
        break;
        
      case "create":
        const nuevaSesion = new SesionTutoria(params);
        await nuevaSesion.save();
        
        res.json({
          isOk: true,
          value: {
            ...nuevaSesion.toObject(),
            __backendId: nuevaSesion._id.toString()
          }
        });
        break;
        
      case "update":
        const { __backendId, ...datosActualizar } = params;
        const sesionActualizada = await SesionTutoria.findByIdAndUpdate(
          __backendId,
          datosActualizar,
          { new: true }
        );
        
        if (!sesionActualizada) {
          return res.json({
            isOk: false,
            error: "Sesión no encontrada"
          });
        }
        
        res.json({
          isOk: true,
          value: {
            ...sesionActualizada.toObject(),
            __backendId: sesionActualizada._id.toString()
          }
        });
        break;
        
      case "delete":
        const sesionEliminada = await SesionTutoria.findByIdAndDelete(params.__backendId);
        
        if (!sesionEliminada) {
          return res.json({
            isOk: false,
            error: "Sesión no encontrada"
          });
        }
        
        res.json({
          isOk: true,
          value: {
            ...sesionEliminada.toObject(),
            __backendId: sesionEliminada._id.toString()
          }
        });
        break;
        
      default:
        res.json({
          isOk: false,
          error: "Método no soportado"
        });
    }
  } catch (error) {
    console.error("❌ Error en API dataSdk:", error);
    res.json({
      isOk: false,
      error: error.message
    });
  }
});

// ============================
// 5. ENCENDER SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
