import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import conectarDB from './db.js';
import usuariosRoutes from './routes/usuarios.js';
import librosRoutes from './routes/libros.js';

const app = express();
app.use(express.json());

// Conectar a MongoDB
conectarDB();

// Ruta raíz
app.get('/', (req, res) => {
    res.send('API funcionando');
  });

app.use('/', usuariosRoutes);
app.use('/', librosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});