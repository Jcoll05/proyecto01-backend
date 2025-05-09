import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { 
    type: String, 
    unique: true, 
    required: true, 
    lowercase: true, 
    match: [/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/, 'El correo debe tener un formato válido'] 
  },
  contraseña: { type: String, required: true },
  creado_en: { type: Date, default: Date.now },
  inhabilitado: { type: Boolean, default: false },
  permisos: { type: [String], default: [] } // Listado de permisos
});


const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;