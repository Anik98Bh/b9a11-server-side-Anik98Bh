const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jgrphar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const queriesCollection = client.db('alternativeStocks').collection('queries');
        // const userCollection = client.db('alternativeStocks').collection('user');

        app.get('/queries', async (req, res) => {
            const cursor = queriesCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.post('/queries', async (req, res) => {
            const newQueries = req.body;
            const result = await queriesCollection.insertOne(newQueries);
            res.send(result);
        })

        // user related api
        app.get('/myQueries/:email', async (req, res) => {
            const email = req.params.email;
            const result = await queriesCollection.find({ email }).toArray();
            res.send(result);
        })


        app.delete('/myQueries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await queriesCollection.deleteOne(query);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Alternative Stocks Is Running')
})

app.listen(port, () => {
    console.log(`Alternative Stocks server Is Running on port ${port}`)
})