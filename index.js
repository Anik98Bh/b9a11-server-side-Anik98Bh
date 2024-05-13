const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors({
    origin: [
        'http://localhost:5173'
    ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jgrphar.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// create middlewares
const logger = async (req, res, next) => {
    console.log('called:', req.host, req.originalUrl)
    next();
}

const verifyToken = async (req, res, next) => {
    const token = req?.cookies?.token;
    console.log('value of token in middleware', token);
    if (!token) {
        return res.status(401).send({ message: 'not authorized' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        //err
        if (err) {
            console.log(err)
            return res.status(401).send({ message: 'unauthorized access' })
        }
        //if token is valid then it would be decoded
        console.log('value in the token', decoded)
        req.user = decoded;
        next();
    })
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const queriesCollection = client.db('alternativeStocks').collection('queries');
        const recommendationCollection = client.db('alternativeStocks').collection('recommendation');

        //auth related api
        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                })
                .send({ success: true });
        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user)
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })


        //queries related api
        app.get('/queries', logger, async (req, res) => {
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
        app.get('/myQueries/:email', logger, verifyToken, async (req, res) => {
            const email = req.params.email;
            console.log('tok tok token', req.cookies.token)
            console.log('user in the valid token', req?.user)
            if (req.params?.email !== req.user?.email) {
                return res.status(403).send({ message: 'forbidden access two' })
            }
            const result = await queriesCollection.find({ email }).toArray();
            res.send(result);
        })

        app.get('/myQueries/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const result = await queriesCollection.findOne({ _id: id });
            res.send(result);
        })

        app.put('/myQueries/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateQueries = req.body;
            const myQueries = {
                $set: {
                    name: updateQueries.name,
                    brand: updateQueries.brand,
                    title: updateQueries.title,
                    reason: updateQueries.reason,
                    image: updateQueries.image,
                }
            }
            const result = await queriesCollection.updateOne(filter, myQueries, options);
            res.send(result)
        })

        app.delete('/myQueries/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await queriesCollection.deleteOne(query);
            res.send(result)
        })

        //recommendation api

        app.get('/recommendation', logger, async (req, res) => {
            const cursor = recommendationCollection.find();
            const result = await cursor.toArray();
            res.send(result)
        })

        app.get('/recommendation/:email', logger, async (req, res) => {
            const email = req.params?.email;
            console.log(email)
            const result = await recommendationCollection.find({recommenderEmail:email}).toArray();
            res.send(result);
        })

        app.post('/recommendation', async(req,res)=>{
            const newRecommendation = req.body;
            const result = await recommendationCollection.insertOne(newRecommendation);
            res.send(result);
        })

        app.delete('/recommendation/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await recommendationCollection.deleteOne(query);
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