import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js'; // Asegúrate que el path sea correcto

const SECRET = process.env.JWT_SECRET;

export async function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ mensaje: 'Token no proporcionado' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ mensaje: 'Token inválido' });

  try {
    const payload = jwt.verify(token, SECRET);

    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findById(payload.id);

    if (!usuario || usuario.inhabilitado) {
      return res.status(401).json({ mensaje: 'Usuario no válido o inhabilitado' });
    }

    // Agregar info del usuario al request
    req.usuario = {
      id: usuario._id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      permisos: usuario.permisos || []
    };

    next();
  } catch (err) {
    return res.status(403).json({ mensaje: 'Token inválido o expirado', error: err.message });
  }
}