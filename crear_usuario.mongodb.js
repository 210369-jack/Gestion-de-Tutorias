// Seleccionamos la base de datos
use('Gestion_Tutoria');

// Borramos si existiera alguno previo para no duplicar (opcional)
db.getCollection('Coordinador').drop();

// Insertamos al usuario nuevo
db.getCollection('Coordinador').insertOne({
  nombres: "Coordinador General",
  email: "tutor@tutorias.com",
  password: "admin123",
  rol: "coordinador"
}); 