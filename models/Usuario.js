import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: String,
  correo: { type: String, unique: true },
  contraseña: String,
  creado_en: { type: Date, default: Date.now },
  inhabilitado: { type: Boolean, default: false },
  permisos: { type: [String], default: [] }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);
export default Usuario;