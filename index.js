const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config()
app.use(morgan('dev'))



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.LINGUAVERSE_NAME}:${process.env.LINGUAVERSE_PASS}@cluster0.eujpnmx.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();
    // Send a ping to confirm a successful connection


    const usersCollection = client.db('summerCampUsersDB').collection('summerCampUsers');
    const classesCollection =  client.db('summerCampUsersDB').collection('classes');



    // TODO : we will apply get operation in this users routes when we wanna to do admin routes

    app.post('/users',async(req,res)=>{
      const users = req.body;
      const query = {email:users?.email}
      const isExitUsers =await usersCollection.findOne(query)
      if(isExitUsers){
        return res.status(401).send({error:true,message:'users already exit'})
      }
      const result = await usersCollection.insertOne(users)
      res.send(result)
    })


  






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);










app.get('/',(req,res)=>{
    res.send('LinguaVerse is searching now new languages...')
})


app.listen(port,()=>{
    console.log(`LinguaVerse is running on port ${port}`)
})