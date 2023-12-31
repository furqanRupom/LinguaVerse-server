const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
require("dotenv").config();
app.use(morgan("dev"));

const stripe = require("stripe")(process.env.STRIPE_SECRET_TOKEN);

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized access denied!" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (error, decoded) => {
    if (error) {
      return res
        .status(403)
        .send({ error: true, message: "Unauthorized access denied!" });
    }
    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.LINGUAVERSE_NAME}:${process.env.LINGUAVERSE_PASS}@cluster0.eujpnmx.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const usersCollection = client
      .db("summerCampUsersDB")
      .collection("summerCampUsers");
    const classesCollection = client
      .db("summerCampUsersDB")
      .collection("classes");
    const selectedClassesCollection = client
      .db("summerCampUsersDB")
      .collection("selectedClasses");

    const paymentsCollection = client
      .db("summerCampUsersDB")
      .collection("payments");

    const enrolledClassCollection = client
      .db("summerCampUsersDB")
      .collection("enrolledClasses");

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user.role !== "admin") {
        return res
          .status(401)
          .send({ error: true, message: "Access forbidden" });
      }
      next();
    };

    const verifyInstructor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user.role !== "instructor") {
        return res
          .status(401)
          .send({ error: true, message: "Access forbidden" });
      }
      next();
    };

    const verifyStudent = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user.role !== "student") {
        return res
          .status(401)
          .send({ error: true, message: "Access forbidden" });
      }
      next();
    };

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "1hr",
      });
      res.send({ token });
    });

    // users

    app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const users = req.body;
      const query = { email: users?.email };
      const isExitUsers = await usersCollection.findOne(query);
      if (isExitUsers) {
        return res
          .status(401)
          .send({ error: true, message: "users already exit" });
      }
      const result = await usersCollection.insertOne(users);
      res.send(result);
    });

    // verify admin

    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      console.log(req.decoded.email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ admin: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      console.log(result);
      res.send(result);
    });

    // verifyInstructor

    app.get("/users/instructor/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      console.log(req.decoded.email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ instructor: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      console.log(result);
      res.send(result);
    });

    // verify student

    app.get("/users/student/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      console.log(req.decoded.email);
      if (email !== req.decoded.email) {
        return res.status(403).send({ student: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { student: user?.role === "student" };
      console.log(result);
      res.send(result);
    });

    // classes

    // all classes

    app.get("/allClasses", verifyJWT, verifyAdmin, async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });

    app.get("/classes", verifyJWT, verifyInstructor, async (req, res) => {
      const email = req.query.email;
      const query = { instructorEmail: email };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/classes", async (req, res) => {
      const classes = req.body;
      const result = await classesCollection.insertOne(classes);
      res.send(result);
    });

    app.put("/classes/:id", async (req, res) => {
      const id = req.params.id;
      const classInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateClass = {
        $set: {
          className: classInfo.className,
          image: classInfo.image,
          seats: classInfo.seats,
          price: classInfo.price,
        },
      };
      const result = await classesCollection.updateOne(filter, updateClass);
      res.send(result);
    });

    app.delete("/classes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await classesCollection.deleteOne(query);
      res.send(result);
    });

    // admin

    // // give feedback

    app.put("/allClasses/feedback/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const feedbackInfo = req.body;
      console.log(feedbackInfo);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const sentFeedBack = {
        $set: {
          feedback: feedbackInfo.feedback,
        },
      };
      const result = await classesCollection.updateOne(
        filter,
        sentFeedBack,
        options
      );
      res.send(result);
    });

    // approved

    app.patch("/allClasses/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const approvedClass = {
        $set: {
          status: "approved",
        },
      };

      const result = await classesCollection.updateOne(filter, approvedClass);
      res.send(result);
    });

    // denied

    app.patch("/allClasses/denied/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const approvedClass = {
        $set: {
          status: "denied",
        },
      };
      const result = await classesCollection.updateOne(filter, approvedClass);
      res.send(result);
    });

    // make admin

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const newAdmin = {
        $set: {
          role: "admin",
        },
      };
      const options = { upsert: true };

      const result = await usersCollection.updateOne(filter, newAdmin, options);
      res.send(result);
    });

    // make instructor

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const newInstructor = {
        $set: {
          role: "instructor",
        },
      };
      const result = await usersCollection.updateOne(filter, newInstructor);
      res.send(result);
    });

    // instructors

    app.get("/users/instructors", async (req, res) => {
      const query = { role: "instructor" };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // approved classes

    app.get("/classes/approved", async (req, res) => {
      const query = { status: "approved" };
      const result = await classesCollection.find(query).toArray();
      res.send(result);
    });

    // student

    app.delete(
      "/selectedClasses/:id",
      verifyJWT,
      verifyStudent,
      async (req, res) => {
        const id = req.params.id;
        const query = { selectClassId: id };
        console.log(query, id);
        const result = await selectedClassesCollection.deleteOne(query);
        res.send(result);
      }
    );

    app.delete(
      "/enrolledClasses/:id",
      verifyJWT,
      verifyStudent,
      async (req, res) => {
        const id = req.params.id;
        const query = { selectClassId: id };
        // console.log(query, id);
        const result = await enrolledClassCollection.deleteOne(query);
        res.send(result);
      }
    );

    app.get(
      "/selectClasses/:email",
      verifyJWT,
      verifyStudent,
      async (req, res) => {
        const email = req.params.email;
        const query = { studentEmail: email };
        console.log(query);
        const result = await selectedClassesCollection.find(query).toArray();
        res.send(result);
      }
    );

    app.post("/selectedClasses", async (req, res) => {
      const selectClass = req.body;
      const result = await selectedClassesCollection.insertOne(selectClass);
      res.send(result);
    });

    app.get("/popular/instructors", async (req, res) => {
      const query = { role: "instructor" };
      const result = await usersCollection.find(query).limit(6).toArray();
      res.send(result);
    });

    // popular classes

    app.get("/classes/popular", async (req, res) => {

      const result = await classesCollection
        .find()
        .sort({ enrol: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // get enroll data by email

    app.get("/classes/enroll/:email",verifyJWT,verifyStudent, async (req, res) => {
      const email = req.params.email;
      const query = { studentEmail: email };
      const result = await enrolledClassCollection.find(query).toArray();
      res.send(result);
    });

    // payments history

    app.get("/payments/history/:email",verifyJWT,verifyStudent, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const sortOptions = { split: -1 };

      const result = await paymentsCollection
        .find(query)
        .sort(sortOptions)
        .toArray();

      // Reverse the order of the documents
      const reversedResult = result.reverse();

      res.json(reversedResult);
    });

    // payments

    app.post("/create-payment-intend", verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", verifyJWT, async (req, res) => {
      const payment = req.body;
      console.log(payment);
      const insertedResult = await paymentsCollection.insertOne(payment);
      // and remove this all item from carts collection after payment...
      // enrollment
      const queryClass = {
        _id: new ObjectId(payment.selectedClassId),
      };

      const query = {
        selectClassId: payment.selectedClassId,
      };

      const findEnrollClasses = await selectedClassesCollection.findOne(query);
      const insertOnEnrollment = await enrolledClassCollection.insertOne(
        findEnrollClasses
      );
      const deletedResult = await selectedClassesCollection.deleteOne(query);

      const updateClass = {
        $inc: {
          seats: -1,
          enrol: 1,
        },
      };
      const updatedClassCollection = await classesCollection.updateOne(
        queryClass,
        updateClass
      );
      res.send({
        insertedResult,
        deletedResult,
        insertOnEnrollment,
        updatedClassCollection,
      });
    });

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("LinguaVerse is searching now new languages...");
});

app.listen(port, () => {
  console.log(`LinguaVerse is running on port ${port}`);
});
