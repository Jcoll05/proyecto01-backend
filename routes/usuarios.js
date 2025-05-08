import express from 'express';
import bcrypt from 'bcrypt';
import Usuario from '../models/Usuario.js';

const router = express.Router();

// Crear usuario
router.post('/usuarios', async (req, res) => {
    const { nombre, correo, contraseña } = req.body;
    if (!nombre || !correo || !contraseña) {
        return res.status(400).json({ mensaje: "Faltan campos requeridos" });
    }

    try {
        const existe = await Usuario.findOne({ correo });
        if (existe) {
            return res.status(409).json({ mensaje: "El correo ya está registrado" });
        }

        const contraseñaHasheada = await bcrypt.hash(contraseña, 10); // 10 = salt rounds

        const nuevoUsuario = new Usuario({ nombre, correo, contraseña: contraseñaHasheada });
        await nuevoUsuario.save();
        res.status(201).json({ mensaje: "Usuario creado", usuario: nuevoUsuario });
    } catch (err) {
        res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
    }
});

// Login
router.post('/usuarios/login', async (req, res) => {
    const { correo, contraseña } = req.body;
    if (!correo || !contraseña) {
        return res.status(400).json({ mensaje: "Faltan campos requeridos" });
    }

    try {
        const usuario = await Usuario.findOne({ correo });
        if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

        const coincide = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!coincide) {
            return res.status(401).json({ mensaje: "Contraseña incorrecta" });
        }

        res.status(200).json({ mensaje: "Login exitoso", usuario });
    } catch (err) {
        res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
    }
});

// Actualizar
router.put('/usuarios/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, correo, contraseña } = req.body;

    try {
        const usuario = await Usuario.findById(id);
        if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

        usuario.nombre = nombre;
        usuario.correo = correo;

        // Solo hashear si el campo contraseña fue enviado
        if (contraseña) {
            const contraseñaHasheada = await bcrypt.hash(contraseña, 10);
            usuario.contraseña = contraseñaHasheada;
        }

        await usuario.save();

        res.status(200).json({ mensaje: "Usuario actualizado", usuario });
    } catch (err) {
        res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
    }
});

// Eliminar (soft delete)
router.delete('/usuarios/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const usuario = await Usuario.findById(id);
        if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

        usuario.inhabilitado = true;
        await usuario.save();

        res.status(200).json({ mensaje: "Usuario inhabilitado", usuario });
    } catch (err) {
        res.status(500).json({ mensaje: "Error en el servidor", error: err.message });
    }
});

export default router;