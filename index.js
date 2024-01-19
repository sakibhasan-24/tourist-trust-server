const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.port || 5000;

app.use(cors());
app.use(express.json());
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
console.log(process.env.MONGO_URL);
const client = new MongoClient(process.env.MONGO_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const touristCollection = client.db("tourist-trust").collection("tourist");
  const overviewCollection = client.db("tourist-trust").collection("overview");
  const tourPackageCollection = client
    .db("tourist-trust")
    .collection("package-tour");

  try {
    // jwt token related activities
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN);
      res.send({ token });
    });
    // end of token
    app.post("/tourist-list", async (req, res) => {
      const data = req.body;
      const existingTourist = await touristCollection.findOne({
        email: data.email,
      });
      if (existingTourist.email === data.email) {
        return res.send({ message: "Already Exist" });
      }
      const result = await touristCollection.insertOne(data);
      res.send(result);
    });
    // make admin
    app.patch("/make-admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: "admin" } };
      const result = await touristCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // make tourist guide
    app.patch("/make-tourist-guide/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: "tourist guide" } };
      const result = await touristCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // overview section
    app.get("/overview", async (req, res) => {
      const data = await overviewCollection.find().toArray();
      res.send(data);
    });
    // package tour
    app.get("/package-tour", async (req, res) => {
      const data = await tourPackageCollection.find().toArray();
      res.send(data);
    });
    // for only 3/4
    app.get("/package-tour/initial", async (req, res) => {
      const data = await tourPackageCollection.find().limit(3).toArray();
      res.send(data);
    });
    // create package
    app.post("/package-tour", async (req, res) => {
      const data = req.body;
      const result = await tourPackageCollection.insertOne(data);
      res.send(result);
    });
    // get single package
    app.get("/package-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const data = await tourPackageCollection.findOne(query);
      res.send(data);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
