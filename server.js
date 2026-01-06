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

// ========================================================
// MODELO HU1 (GESTIÓN DE USUARIOS) - FINAL
// ========================================================
const NuevoUsuarioSchema = new mongoose.Schema({
  id: String,             // Aquí guardamos el DNI
  nombreUsuario: String,  
  gmail: String,          
  tipo: String,           
  idMatricula: String
}, { collection: 'Usuarios' }); // Apunta a la colección 'Usuarios'

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
// Proceso de Login actualizado para 3 roles
// En el proceso de login, redirigir según el rol:
app.post("/login", async (req, res) => {
  const { correo, password, rol } = req.body;

  try {
    const usuario = await Usuario.findOne({ 
      email: correo,
      rol: rol
    });

    if (!usuario || usuario.password !== password) {
      return res.send("<script>alert('Credenciales incorrectas'); window.location.href='/';</script>");
    }

    // Redirigir al dashboard correspondiente
    if (rol === 'admin') {
      res.redirect("/admin-dashboard.html");
    } else if (rol === 'tutor') {
      res.redirect("/tutor-dashboard.html");
    } else if (rol === 'verificador') {
      res.redirect("/verificador-dashboard.html");
    } else {
      res.redirect("/");
    }

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).send("Error interno");
  }
});

/// 2. POST: Guardar nuevo usuario
app.post('/api/usuarios', async (req, res) => {
    try {
        const nuevoUsuario = new NuevoUsuario({
            id: req.body.dni,            // El HTML envía 'dni', lo guardamos en 'id'
            nombreUsuario: req.body.nombreCompleto || req.body.nombre,
            gmail: req.body.email,       // El HTML envía 'email', lo guardamos en 'gmail'
            tipo: req.body.tipoUsuario || req.body.tipo,
            idMatricula: req.body.matricula
        });
        
        await nuevoUsuario.save();
        res.status(201).json({ message: "Usuario creado exitosamente", usuario: nuevoUsuario });
    } catch (error) {
        console.error("Error al guardar:", error);
        res.status(400).json({ error: "Error al guardar usuario" });
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
// 4. PUT: Actualizar usuario
app.put("/actualizar-usuario/:id", async (req, res) => {
  try {
    const id = req.params.id; // Busca por el _id de MongoDB
    const usuarioActualizado = await NuevoUsuario.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!usuarioActualizado) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    
    res.json({ success: true, message: "Actualización exitosa" });
  } catch (error) {
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

const verificarAutenticacion = (req, res, next) => {
  // Aquí normalmente verificarías un token de sesión
  // Por ahora, solo redirigimos si no hay usuario en la URL (simulación)
  const url = req.url;
  const usuarioAutenticado = req.headers.referer || req.cookies; // Ejemplo básico
  
  // En producción, implementarías un sistema real de autenticación
  next();
};

const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    // En producción, aquí obtendrías el rol del usuario desde la sesión/token
    const rolUsuario = req.query.rol || 'admin'; // Temporal - solo para pruebas
    
    if (rolesPermitidos.includes(rolUsuario)) {
      next();
    } else {
      res.status(403).send(`
        <html>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>⛔ Acceso Denegado</h1>
            <p>No tienes permisos para acceder a esta página.</p>
            <a href="/">Volver al Login</a>
          </body>
        </html>
      `);
    }
  };
};

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

app.get("/admin-dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin-dashboard.html"));
});

app.get("/tutor-dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "tutor-dashboard.html"));
});

app.get("/verificador-dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "verificador-dashboard.html"));
});

app.get("/api/admin/usuarios", async (req, res) => {
  try {
    const usuarios = await NuevoUsuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

app.get("/api/tutor/sesiones", async (req, res) => {
  try {
    const sesiones = await SesionTutoria.find().sort({ fecha: -1 });
    res.json(sesiones);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener sesiones" });
  }
});

app.get("/api/verificador/estadisticas", async (req, res) => {
  try {
    // Estadísticas generales
    const totalSesiones = await SesionTutoria.countDocuments();
    const totalTutores = await Usuario.countDocuments({ rol: 'tutor' });
    const totalEstudiantes = await NuevoUsuario.countDocuments();
    
    // Desempeño por tutor
    const desempenoTutores = await SesionTutoria.aggregate([
      {
        $group: {
          _id: "$tutor",
          totalSesiones: { $sum: 1 },
          promedioDesempeno: { 
            $avg: { 
              $switch: {
                branches: [
                  { case: { $eq: ["$nivel_desempeno", "Excelente"] }, then: 4 },
                  { case: { $eq: ["$nivel_desempeno", "Bueno"] }, then: 3 },
                  { case: { $eq: ["$nivel_desempeno", "Regular"] }, then: 2 },
                  { case: { $eq: ["$nivel_desempeno", "Deficiente"] }, then: 1 }
                ],
                default: 0
              }
            }
          }
        }
      }
    ]);
    
    res.json({
      totalSesiones,
      totalTutores,
      totalEstudiantes,
      desempenoTutores
    });
  } catch (error) {
    console.error("Error en estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// Ejemplo para la ruta de HU1 (solo admin)
app.get("/HU1.html", (req, res) => {
  // En producción, verificarías el rol aquí
  res.sendFile(path.join(__dirname, "HU1.html"));
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
