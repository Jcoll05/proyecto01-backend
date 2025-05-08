import mongoose from 'mongoose';

const conectarDB = async () => {
  try {
    await mongoose.connect(
      'mongodb+srv://jcolla:8-d_%40kgKV84eCj8@cluster0.krcpuug.mongodb.net/project_01_backend?retryWrites=true&w=majority&appName=Cluster0',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('📡 Conectado a MongoDB Atlas');
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

export default conectarDB;