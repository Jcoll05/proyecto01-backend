// import express from 'express';
// import bcrypt from 'bcrypt';
// import Usuario from '../models/Usuario.js';
// import jwt from 'jsonwebtoken';
// import { verificarToken } from '../middleware/auth.js';
// import dotenv from 'dotenv';

// dotenv.config();

// const SECRET = process.env.JWT_SECRET;

// const router = express.Router();

// // Definición de roles y sus permisos
// const roles = {
//     usuario_estandar: ['modificación_propia'],
//     editor: ['modificación_propia', 'crear_libros', 'modificar_libros'],
//     administrador: ['modificación_propia', 'crear_libros', 'modificar_libros', 'modificar_usuarios', 'inhabilitar_usuarios', 'inhabilitar_libros']
// };

// // Crear usuario
// router.post('/usuarios/register', async (req, res) => {
//     const { nombre, correo, contraseña } = req.body;
//     if (!nombre || !correo || !contraseña) {
//         return res.status(400).json({ mensaje: "Faltan campos requeridos" });
//     }

//     try {
//         const existe = await Usuario.findOne({ correo });
//         if (existe) {
//             return res.status(409).json({ mensaje: "El correo ya está registrado" });
//         }

//         const contraseñaHasheada = await bcrypt.hash(contraseña, 10); // 10 = salt rounds

//         // Permisos usuario estandar: ['modificación_propia']
//         // Permisos editor: ['modificación_propia', 'crear_libros', 'modificar_libros']
//         // Permisos administrador: ['modificación_propia', 'crear_libros', 'modificar_libros', 'modificar_usuarios']
//         const nuevoUsuario = new Usuario({
//             nombre, 
//             correo, 
//             contraseña: contraseñaHasheada,
//             permisos: ['modificación_propia'] // Asignamos permisos de usuario estándar
//         });

//         await nuevoUsuario.save();
//         res.status(201).json({ mensaje: "Usuario creado", usuario: nuevoUsuario });
//     } catch (err) {
//         res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
//     }
// });

// //Ejemplo de creacion de usuario:
// //curl -X POST http://localhost:3000/usuarios/register -H "Content-Type: application/json" 
// // -d "{\"nombre\":\"Juan Pérez\",\"correo\":\"juan@example.com\",\"contraseña\":\"1234\"}"




// // Login
// router.post('/usuarios/login', async (req, res) => {
//     const { correo, contraseña } = req.body;
//     if (!correo || !contraseña) {
//         return res.status(400).json({ mensaje: "Faltan campos requeridos" });
//     }

//     try {
//         const usuario = await Usuario.findOne({ correo });
//         if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });
//         if (usuario.inhabilitado) return res.status(403).json({ mensaje: "Usuario inhabilitado" });

//         const coincide = await bcrypt.compare(contraseña, usuario.contraseña);
//         if (!coincide) {
//             return res.status(401).json({ mensaje: "Contraseña incorrecta" });
//         }

//         // Generar token JWT
//         const payload = {
//             id: usuario._id,
//             correo: usuario.correo,
//             permisos: usuario.permisos
//         };

//         const token = jwt.sign(payload, SECRET, { expiresIn: '2h' });

//         res.status(200).json({ mensaje: "Login exitoso", token });
//     } catch (err) {
//         res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
//     }
// });

// // GET de usuario específico por ID (solo si está habilitado)
// router.get('/usuarios/:id', async (req, res) => {
//     const { id } = req.params;

//     try {
//         const usuario = await Usuario.findOne({ _id: id, inhabilitado: false });

//         if (!usuario) {
//             return res.status(404).json({ mensaje: 'Usuario no encontrado o inhabilitado' });
//         }

//         res.status(200).json(usuario);
//     } catch (err) {
//         res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
//     }
// });

// // Actualizar
// router.put('/usuarios/:id', verificarToken, async (req, res) => {
//     const { id } = req.params;
//     const { nombre, correo, contraseña, permisos, rol } = req.body;

//     const esMismoUsuario = req.usuario.id === id;
//     const puedeModificarUsuarios = req.usuario.permisos.includes('modificar_usuarios');

//     if (!esMismoUsuario && !puedeModificarUsuarios) {
//         return res.status(403).json({ mensaje: "No tienes permiso para modificar este usuario" });
//     }

//     try {
//         const usuario = await Usuario.findById(id);
//         if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

//         if (nombre) usuario.nombre = nombre;
//         if (correo) usuario.correo = correo;

//         if (contraseña) {
//             const contraseñaHasheada = await bcrypt.hash(contraseña, 10);
//             usuario.contraseña = contraseñaHasheada;
//         }

//         // Solo un admin puede cambiar los permisos, puede hacerlo por rol o agregar un permiso individualmente.
//         if (permisos || rol) {
//             if (!puedeModificarUsuarios) {
//                 return res.status(403).json({ mensaje: "No puedes cambiar permisos o rol de este usuario" });
//             }

//             if (rol) {
//                 if (!roles[rol]) {
//                     return res.status(400).json({ mensaje: "Rol no válido" });
//                 }
//                 usuario.permisos = roles[rol];
//             } else if (Array.isArray(permisos)) {
//                 usuario.permisos = permisos;
//             }
//         }

//         await usuario.save();

//         res.status(200).json({ mensaje: "Usuario actualizado", usuario });
//     } catch (err) {
//         res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
//     }
// }); 
// // Permisos usuario estandar: ['modificación_propia']
// // Permisos editor: ['modificación_propia', 'crear_libros', 'modificar_libros']
// // Permisos administrador: ['modificación_propia', 'crear_libros', 'modificar_libros', 'modificar_usuarios']
// // ejemplo de uso si es admin:
// //curl -X PUT http://localhost:3000/usuarios/{id} -H "Content-Type: application/json" -H "Authorization: Bearer token"
// //-d "{\"nombre\":\"Editor\",\"correo\":\"Editor@example.com\",\"contraseña\":\"12345\",\"rol\":\"editor\"}"

// //curl -X PUT http://localhost:3000/usuarios/{id} -H "Content-Type: application/json" -H "Authorization: Bearer token" -d "{\"nombre\":\"Julian\",\"correo\":\"julian@example.com\",\"contraseña\":\"1234\",\"permisos\":[\"modificación_propia\",\"crear_libros\"]}"

// // ejemplo de uso si no es admin:
// // curl -X PUT http://localhost:3000/usuarios/{id} -H "Content-Type: application/json" -H "Authorization: Bearer token"
// // -d "{\"nombre\":\"Usuario Estandar actualizado\",\"correo\":\"estandar@example.com\",\"contraseña\":\"12345\"}"

// // Soft Delete
// router.delete('/usuarios/:id', verificarToken, async (req, res) => {
//     const { id } = req.params;

//     try {
//         const usuarioObjetivo = await Usuario.findById(id);
//         if (!usuarioObjetivo) {
//             return res.status(404).json({ mensaje: "Usuario no encontrado" });
//         }

//         const esMismoUsuario = req.usuario.id === id;
//         const puedeInhabilitarOtros = req.usuario.permisos.includes('modificar_usuarios');
//         const puedeInhabilitarse = req.usuario.permisos.includes('modificación_propia');

//         // Validar si puede realizar la acción
//         if (esMismoUsuario && !puedeInhabilitarse) {
//             return res.status(403).json({ mensaje: "No tienes permiso para deshabilitarte" });
//         }

//         if (!esMismoUsuario && !puedeInhabilitarOtros) {
//             return res.status(403).json({ mensaje: "No tienes permiso para deshabilitar a otros usuarios" });
//         }

//         usuarioObjetivo.inhabilitado = true;
//         await usuarioObjetivo.save();

//         res.status(200).json({ mensaje: "Usuario inhabilitado", usuario: usuarioObjetivo });
//     } catch (err) {
//         res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
//     }
// });

// //curl -X DELETE http://localhost:3000/usuarios/{id} -H "Content-Type: application/json" -H "Authorization: Bearer token"

// export default router;

import express from 'express';
import { verificarToken } from '../middleware/auth.js';
import {
    registerUsuario,
    loginUsuario,
    obtenerUsuarioPorId,
    actualizarUsuario,
    inhabilitarUsuario
} from '../controllers/usuarioController.js';

const router = express.Router();

// Rutas
router.post('/usuarios/register', registerUsuario);
router.post('/usuarios/login', loginUsuario);
router.get('/usuarios/:id', obtenerUsuarioPorId);
router.put('/usuarios/:id', verificarToken, actualizarUsuario);
router.delete('/usuarios/:id', verificarToken, inhabilitarUsuario);

export default router;
