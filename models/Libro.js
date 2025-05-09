import mongoose from 'mongoose';

const reservaSchema = new mongoose.Schema({
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombreUsuario: { type: String, required: true },
    fechaReserva: { type: Date, required: true },
    fechaEntrega: { type: Date, required: true }
  }, { _id: false, timestamps: true }); // ← añade timestamps
  

const libroSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  genero: { type: String, required: true },
  fechaPublicacion: { type: Date, required: true },
  editorial: { type: String, required: true },
  disponible: { type: Boolean, default: true },
  inhabilitado: { type: Boolean, default: false },
  reservas: [reservaSchema]
}, { timestamps: true });

const Libro = mongoose.model('Libro', libroSchema);

// Añadir una nueva reserva a un libro
export const agregarReserva = async (req, res) => {
    const { idLibro } = req.params;
    const { fechaReserva, fechaEntrega } = req.body;
  
    try {
      const libro = await Libro.findById(idLibro);
  
      if (!libro) {
        return res.status(404).json({ mensaje: 'Libro no encontrado' });
      }
  
      if (!libro.disponible) {
        return res.status(400).json({ mensaje: 'El libro no está disponible para reserva' });
      }
  
      if (new Date(fechaReserva) < new Date()) {
        return res.status(400).json({ mensaje: 'La fecha de reserva no puede ser en el pasado' });
      }
  
      if (new Date(fechaEntrega) <= new Date(fechaReserva)) {
        return res.status(400).json({ mensaje: 'La fecha de entrega debe ser posterior a la fecha de reserva' });
      }
  
      const nuevaReserva = {
        usuarioId: req.usuario.id, // tomado del token
        nombreUsuario: req.usuario.nombre, // también del token
        fechaReserva,
        fechaEntrega
      };
  
      libro.reservas.push(nuevaReserva);
      libro.disponible = false;
  
      await libro.save();
  
      res.status(201).json({ mensaje: 'Reserva realizada correctamente', reserva: nuevaReserva });
    } catch (err) {
      res.status(500).json({ mensaje: 'Error al realizar la reserva', error: err.message });
    }
  };

// Obtener todas las reservas de un libro específico
export const obtenerReservas = async (req, res) => {
  const { idLibro } = req.params;

  try {
    const libro = await Libro.findById(idLibro);

    if (!libro) {
      return res.status(404).json({ mensaje: 'Libro no encontrado' });
    }

    res.status(200).json(libro.reservas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener las reservas', error: err.message });
  }
};

// Cancelar una reserva de un libro
export const cancelarReserva = async (req, res) => {
    const { idLibro } = req.params;
    const usuarioId = req.usuario.id; // ID del usuario autenticado
  
    try {
      const libro = await Libro.findById(idLibro);
  
      if (!libro) {
        return res.status(404).json({ mensaje: 'Libro no encontrado' });
      }
  
      // Buscar la reserva del usuario
      const reservaIndex = libro.reservas.findIndex(reserva =>
        reserva.usuarioId.toString() === usuarioId.toString()
      );
  
      if (reservaIndex === -1) {
        return res.status(404).json({ mensaje: 'Reserva no encontrada para este usuario' });
      }
  
      // Eliminar la reserva
      libro.reservas.splice(reservaIndex, 1);
  
      // Si no hay reservas, marcar el libro como disponible nuevamente
      if (libro.reservas.length === 0) {
        libro.disponible = true;
      }
  
      await libro.save();
  
      res.status(200).json({ mensaje: 'Reserva cancelada correctamente', libro });
    } catch (err) {
      res.status(500).json({ mensaje: 'Error al cancelar la reserva', error: err.message });
    }
  };

export default Libro;
