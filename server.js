const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

// Inicializamos el cliente directamente con la URI de entorno para que los tests mantengan la referencia
const client = new MongoClient(process.env.MONGO_URI);
let db;
let collection;

// 1. Inicializar Conexión
async function connectDB() {
    await client.connect();
    db = client.db('MundialDB');
    collection = db.collection('equipos');
    console.log('Conectado exitosamente a la base de datos');
}

async function closeDB() {
    await client.close();
    console.log('Conexión cerrada');
}

// 2. Endpoint GET /equipos
app.get('/equipos', async (req, res) => {
    try {
        const equipos = await collection.find({}).toArray();
        res.status(200).json(equipos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los equipos' });
    }
});

// 3. Endpoint GET /equipos/buscar
app.get('/equipos/buscar', async (req, res) => {
    try {
        const { tecnico } = req.query;
        if (!tecnico) {
            return res.status(200).json([]);
        }
        
        // Usamos $regex con la opción 'i' para que no distinga mayúsculas ni minúsculas
        const equipos = await collection.find({
            tecnico: { $regex: tecnico, $options: 'i' }
        }).toArray();
        
        res.status(200).json(equipos);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar equipos' });
    }
});

// 4. Endpoint GET /equipos/:id
app.get('/equipos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validamos si el string tiene un formato de ObjectId correcto
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const equipo = await collection.findOne({ _id: new ObjectId(id) });

        if (!equipo) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }

        res.status(200).json(equipo);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el equipo' });
    }
});

// Condición para no bloquear los entornos de prueba levantando el puerto dos veces
if (process.env.NODE_ENV !== 'test') {
    connectDB()
        .then(() => {
            app.listen(port, () => {
                console.log(`Servidor corriendo en el puerto ${port}`);
            });
        })
        .catch(console.error);
}

// Exportamos exactamente lo que server.test.js necesita recibir
module.exports = {
    app,
    connectDB,
    closeDB,
    client
};