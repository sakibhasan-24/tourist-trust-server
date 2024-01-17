const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
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

  try {
    app.post("/tourist-list", async (req, res) => {
      const data = req.body;
      const result = await touristCollection.insertOne(data);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
