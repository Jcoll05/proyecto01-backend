// controllers/libroController.js
import Libro from '../models/Libro.js';

// Crear libro
export const crearLibro = async (req, res) => {
    const { titulo, autor, genero, fechaPublicacion, editorial } = req.body;

    if (!req.usuario.permisos.includes('crear_libros')) {
        return res.status(403).json({ mensaje: 'No tienes permiso para crear libros' });
    }

    if (!titulo || !autor || !genero || !fechaPublicacion || !editorial) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    try {
        const nuevoLibro = new Libro({ titulo, autor, genero, fechaPublicacion, editorial });
        await nuevoLibro.save();
        res.status(201).json({ mensaje: 'Libro creado', libro: nuevoLibro });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
};

// Obtener libros con filtros
export const obtenerLibros = async (req, res) => {
    const { titulo, autor, genero, fechaPublicacion, editorial, disponibilidad } = req.query;

    let filtros = { inhabilitado: false };

    if (titulo) filtros.titulo = { $regex: titulo, $options: 'i' };
    if (autor) filtros.autor = { $regex: autor, $options: 'i' };
    if (genero) filtros.genero = { $regex: genero, $options: 'i' };
    if (fechaPublicacion) filtros.fechaPublicacion = { $eq: fechaPublicacion };
    if (editorial) filtros.editorial = { $regex: editorial, $options: 'i' };
    if (disponibilidad) filtros.disponibilidad = disponibilidad === 'true';

    try {
        const libros = await Libro.find(filtros);
        res.status(200).json(libros);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
};

// Obtener libros inhabilitados
export const obtenerLibrosInhabilitados = async (req, res) => {
    try {
        const libros = await Libro.find({ inhabilitado: true });
        res.status(200).json(libros);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
};

// Obtener libro por ID
export const obtenerLibroPorId = async (req, res) => {
    const { id } = req.params;

    try {
        const libro = await Libro.findOne({ _id: id, inhabilitado: false });
        if (!libro) return res.status(404).json({ mensaje: 'Libro no encontrado o inhabilitado' });
        res.status(200).json(libro);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
};

// Actualizar libro
export const actualizarLibro = async (req, res) => {
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
};

// Inhabilitar libro
export const inhabilitarLibro = async (req, res) => {
    const { id } = req.params;

    if (!req.usuario.permisos.includes('modificar_libros')) {
        return res.status(403).json({ mensaje: 'No tienes permiso para inhabilitar libros' });
    }

    try {
        const libro = await Libro.findById(id);
        if (!libro) return res.status(404).json({ mensaje: 'Libro no encontrado' });

        libro.inhabilitado = true;
        await libro.save();
        res.status(200).json({ mensaje: 'Libro inhabilitado', libro });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error en el servidor', error: err.message });
    }
};

// Obtener todas las reservas de un usuario (admin o dueño)
export const obtenerReservasPorUsuario = async (req, res) => {
    const { idUsuario } = req.params;

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
};