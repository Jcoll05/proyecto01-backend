import express from 'express';
import Libro from '../models/Libro.js';
import { agregarReserva, obtenerReservas, cancelarReserva } from '../models/Libro.js';
import { verificarToken } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET;

const router = express.Router();



// Crear libro
router.post('/libros/create', verificarToken, async (req, res) => {
    const { titulo, autor, genero, fechaPublicacion, editorial } = req.body;

    // Validar permisos
    if (!req.usuario.permisos.includes('crear_libros')) {
        return res.status(403).json({ mensaje: 'No tienes permiso para crear libros' });
    }

    // Validar campos obligatorios
    if (!titulo || !autor || !genero || !fechaPublicacion || !editorial) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    try {
        const nuevoLibro = new Libro({
            titulo,
            autor,
            genero,
            fechaPublicacion,
            editorial
        });

        await nuevoLibro.save();
        res.status(201).json({ mensaje: 'Libro creado', libro: nuevoLibro });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
});

//Ejemplo de creacion: 
// curl -X POST http://localhost:3000/libros/create -H "Content-Type: application/json" -H "Authorization: Bearer token" -d 
// "{\"titulo\":\"Cien años de soledad\",\"autor\":\"Gabriel García Márquez\",\"genero\":\"Realismo mágico\",
// \"fechaPublicacion\":\"1967-05-30\",\"editorial\":\"Sudamericana\"}"

// GET de libros con filtros combinados
router.get('/libros', async (req, res) => {
    const { titulo, autor, genero, fechaPublicacion, editorial, disponibilidad } = req.query;


    let filtros = { inhabilitado: false };

    // Agregar filtros solo si se proporcionan
    if (titulo) {
        filtros.titulo = { $regex: titulo, $options: 'i' };
    }
    if (autor) {
        filtros.autor = { $regex: autor, $options: 'i' };
    }
    if (genero) {
        filtros.genero = { $regex: genero, $options: 'i' };
    }
    if (fechaPublicacion) {
        filtros.fechaPublicacion = { $eq: fechaPublicacion };
    }
    if (editorial) {
        filtros.editorial = { $regex: editorial, $options: 'i' };
    }
    if (disponibilidad) {
        filtros.disponibilidad = disponibilidad === 'true'; // "true" o "false" como string
    }

    try {
        const libros = await Libro.find(filtros);
        res.status(200).json(libros);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
});

//Ejemplo de filtros: http://localhost:3000/libros?titulo=Cien%20a%C3%B1os%20de%20soledad

//GET de libros inhabilitados
router.get('/libros-inhabilitados', async (req, res) => {
    try {
        const libros = await Libro.find({ inhabilitado: true });
        res.status(200).json(libros);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
});

// GET de libro específico por ID
router.get('/libros/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const libro = await Libro.findOne({ _id: id, inhabilitado: false });

        if (!libro) {
            return res.status(404).json({ mensaje: 'Libro no encontrado o inhabilitado' });
        }

        res.status(200).json(libro);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
});

//UPDATE de libros
router.put('/libros/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { titulo, autor, genero, fechaPublicacion, editorial } = req.body;

    if (!req.usuario.permisos.includes('modificar_libros')) {
        return res.status(403).json({ mensaje: 'No tienes permiso para modificar libros' });
    }

    try {
        const libro = await Libro.findById(id);
        if (!libro) return res.status(404).json({ mensaje: 'Libro no encontrado' });

        if (titulo) libro.titulo = titulo;
        if (autor) libro.autor = autor;
        if (genero) libro.genero = genero;
        if (fechaPublicacion) libro.fechaPublicacion = fechaPublicacion;
        if (editorial) libro.editorial = editorial;

        await libro.save();
        res.status(200).json({ mensaje: 'Libro modificado', libro });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
});

//Ejemplo de modificacion
//curl -X PUT http://localhost:3000/libros/{id} -H "Content-Type: application/json" -H "Authorization: Bearer token" -d 
// "{\"titulo\":\"Cien años de soledad\",\"autor\":\"Gabriel García Márquez\",\"genero\":\"Realismo mágico\",
// \"fechaPublicacion\":\"1967-05-30\",\"editorial\":\"Sudamericana\"}"

// Soft delete (inhabilitar) libro
router.delete('/libros/:id', verificarToken, async (req, res) => {
    const { id } = req.params;

    // Validar permisos
    if (!req.usuario.permisos.includes('modificar_libros')) {
        return res.status(403).json({ mensaje: 'No tienes permiso para inhabilitar libros' });
    }

    try {
        const libro = await Libro.findById(id);
        if (!libro) {
            return res.status(404).json({ mensaje: 'Libro no encontrado' });
        }

        libro.inhabilitado = true;
        await libro.save();

        res.status(200).json({ mensaje: 'Libro inhabilitado', libro });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
});

//Ejemplo de soft delete
// curl -X DELETE http://localhost:3000/libros/{id} -H "Content-Type: application/json" -H 
// "Authorization: Bearer token"


// Ruta para realizar una nueva reserva
router.post('/libros/:idLibro/reservar', verificarToken, agregarReserva);

// Ruta para obtener las reservas de un libro específico (pasadas y nuevas)
router.get('/libros/:idLibro/reservas', verificarToken, (req, res, next) => {
      // Middleware inline para verificar el permiso
      if (!req.usuario.permisos.includes('ver_historial')) {
        return res.status(403).json({ mensaje: 'No tienes permiso para ver el historial de reservas' });
      }
      next(); // continuar si tiene permiso
    },
    obtenerReservas
  );

// Ruta para cancelar una reserva
router.delete('/libros/:idLibro/cancelar', verificarToken, cancelarReserva);

// Buscar todas las reservas hechas por el usuario (solo el administrador puede ver reservas de otros usuarios)
router.get('/usuarios/:idUsuario/reservas', verificarToken, async (req, res) => {
    const { idUsuario } = req.params;

    // Validación de acceso
    const usuarioEsAdmin = req.usuario.permisos.includes('modificar_usuarios');
    const usuarioEsPropietario = req.usuario.id.toString() === idUsuario.toString();


    if (!usuarioEsAdmin && !usuarioEsPropietario) {
        return res.status(403).json({ mensaje: 'No tienes permiso para ver estas reservas' });
    }

    try {
        const libros = await Libro.find({ 'reservas.usuarioId': idUsuario });

        const reservasDelUsuario = [];

        libros.forEach(libro => {
            libro.reservas.forEach(reserva => {
                if (reserva.usuarioId.toString() === idUsuario) {
                    reservasDelUsuario.push({
                        libroId: libro._id,
                        titulo: libro.titulo,
                        autor: libro.autor,
                        reserva: {
                            fechaReserva: reserva.fechaReserva,
                            fechaEntrega: reserva.fechaEntrega
                        }
                    });
                }
            });
        });

        res.status(200).json(reservasDelUsuario);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener las reservas del usuario', error: err.message });
    }
});

//Ejemplo de uso de reservas:
//
//curl -X POST http://localhost:3000/libros/{idLibro}/reservar  -H "Content-Type: application/json" -H 
// "Authorization: Bearer token" -d "{\"fechaReserva\":\"2025-05-09T10:00:00\",\"fechaEntrega\":\"2025-05-16T10:00:00\"}"

//curl -X DELETE http://localhost:3000/libros/{idLibro}/cancelar  -H "Content-Type: application/json" -H 
// "Authorization: Bearer token" -d "{\"fechaReserva\":\"2025-05-09T10:00:00\",\"fechaEntrega\":\"2025-05-16T10:00:00\"}"

//curl -X GET http://localhost:3000/usuarios/{idUsuarios}/reservas  -H "Content-Type: application/json" -H 
// "Authorization: Bearer token"



export default router;