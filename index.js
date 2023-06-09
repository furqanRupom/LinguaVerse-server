const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
require('dotenv').config()
app.use(morgan('dev'))



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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


    // users

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




    // classes


    // all classes

      app.get('/allClasses',async(req,res)=>{
        const result = await classesCollection.find().toArray()
        res.send(result);
      })


    // TODO : verify users

    app.get('/classes',async(req,res)=>{
      const email = req.query.email;
      const query = {instructorEmail:email};
      const result = await classesCollection.find(query).toArray()
      res.send(result);
    })


    app.post('/classes',async(req,res)=>{
      const classes = req.body
      const result = await classesCollection.insertOne(classes)
      res.send(result);
    })


    app.put('/classes/:id',async(req,res)=>{
      const id = req.params.id;
      const classInfo = req.body
      const filter = {_id:new ObjectId(id)}
      const updateClass = {
        $set:{
            className:classInfo.className,
            seats:classInfo.seats,
            price:classInfo.price
        }
      }
      const result = await classesCollection.updateOne(filter,updateClass)
      res.send(result)
    })


    app.delete('/classes/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await classesCollection.deleteOne(query)
      res.send(result)
    })




    // admin

     // // give feedback

   app.put('/allClasses/feedback/:id',async(req,res)=>{
    const id = req.params.id;
    console.log(id)
    const feedbackInfo = req.body
    console.log(feedbackInfo)
    const filter = {_id:new ObjectId(id)}
    const options = {upsert:true}
    const sentFeedBack = {
      $set:{
        feedback:feedbackInfo.feedback
      }

    }
    const result = await classesCollection.updateOne(filter,sentFeedBack,options)
    res.send(result);
   })





    // approved

    app.patch('/allClasses/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id:new ObjectId(id)}
      const approvedClass = {
        $set:{
          status:'approved'
        }
      }

      const result = await classesCollection.updateOne(filter,approvedClass)
      res.send(result);
    })

    // denied

    app.patch('/allClasses/denied/:id',async(req,res)=>{
      const id = req.params.id;
      const filter = {_id:new ObjectId(id)}
      const approvedClass = {
        $set:{
          status:'denied'
        }
      }

      const result = await classesCollection.updateOne(filter,approvedClass)
      res.send(result);
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