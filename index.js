const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {
    res.send('Alternative Stocks Is Running')
})

app.listen(port, () => {
    console.log(`Alternative Stocks server Is Running on port ${port}`)
})