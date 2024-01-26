const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.port || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://tourist-trust.web.app/"],
    credentials: true,
  })
);
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

  const wishListCollection = client.db("tourist-trust").collection("wish-list");
  const bookingCollection = client.db("tourist-trust").collection("booking");
  const tourGuideCollection = client
    .db("tourist-trust")
    .collection("tour-guide");
  const tourGuideCollectionList = client
    .db("tourist-trust")
    .collection("tour-guide-list");
  try {
    // jwt token related activities
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN);
      res.send({ token });
    });

    // end of token
    // verify token
    const verfiyToken = (req, res, next) => {
      const headers = req.headers.authorization;
      if (!headers) {
        return res
          .status(401)
          .send({ error: true, message: "unauthorized access" });
      }
      const token = headers.split(" ")[1];
      if (!token) {
        return res
          .status(401)
          .send({ error: true, message: "unauthorized access" });
      }
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .send({ error: true, message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
    };
    // create USer list
    app.post("/tourist-list", async (req, res) => {
      const data = req.body;
      // console.log(data);s
      const existingTourist = await touristCollection.findOne({
        email: data.email,
      });
      // console.log(existingTourist);
      if (existingTourist && existingTourist.email === data.email) {
        return res.send({ message: "Already Exist" });
      }
      const result = await touristCollection.insertOne(data);
      // console.log(result);
      res.send(result);
    });
    // find user role
    app.get("/tourist-list/:email", async (req, res) => {
      try {
        const email = req.params.email;
        // console.log(email);
        const query = { email: email };
        // console.log(query);
        const result = await touristCollection.findOne(query);
        // console.log(result);
        res.send(result?.role);
      } catch (error) {
        console.log(error);
      }
    });
    app.get("/tourist-list", async (req, res) => {
      const result = await touristCollection.find({}).toArray();
      res.send(result);
    });
    app.delete("/tourist-list/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await touristCollection.deleteOne(query);
      res.send(result);
    });
    // make admin
    app.patch("/make-admin/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };
      const { role } = req.body;
      console.log(role);
      const existingTourist = await touristCollection.findOne(filter);
      console.log("exis", existingTourist);
      const updateDoc = { $set: { role: role } };
      // console.log(updateDoc);
      const result = await touristCollection.updateOne(filter, updateDoc);
      console.log(result);
      res.send(result);
    });
    // make tourist guide
    app.patch("/make-tourist-guide/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: "Guide" } };
      const result = await touristCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // get tourist guide
    app.get("/tourist-guide", async (req, res) => {
      const result = await touristCollection.find({ role: "Guide" }).toArray();
      res.send(result);
    });
    // get admin list
    app.get("/admin-list", async (req, res) => {
      const result = await touristCollection.find({ role: "Admin" }).toArray();
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
    // add wish list
    app.post("/wish-list", async (req, res) => {
      const data = req.body;
      const existingWishList = await wishListCollection.findOne({
        tourId: data.tourId,
      });
      // console.log(data.tourId);
      // console.log(existingWishList);
      if (
        existingWishList &&
        existingWishList.touristEmail === data.touristEmail &&
        data.tourId === existingWishList.tourId
      ) {
        // console.log("already Added");
        return res.send("already Added");
      }
      const result = await wishListCollection.insertOne(data);
      res.send(result);
    });
    // get wish list
    app.get("/wish-list", async (req, res) => {
      const data = await wishListCollection.find().toArray();
      res.send(data);
    });
    // get wish list by email
    app.get("/wish-list/:email", async (req, res) => {
      const email = req.params.email;
      const query = { touristEmail: email };
      const result = await wishListCollection.find(query).toArray();
      res.send(result);
    });
    // delete wish list
    app.delete("/wish-list/:id", async (req, res) => {
      const id = req.params.id;
      const query = { tourId: id };
      // console.log(query, id);
      const existingWishList = await wishListCollection.findOne(query);
      // console.log(existingWishList);
      if (!existingWishList) {
        return res.send("No such wish list");
      }
      const result = await wishListCollection.deleteOne(query);
      res.send(result);
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
    // tour booking
    app.post("/tour-booking", async (req, res) => {
      const data = req.body;
      const result = await bookingCollection.insertOne(data);
      res.send(result);
    });
    // get tourist see his/her booking
    app.get("/tour-booking/:email", async (req, res) => {
      try {
        const query = { userEmail: req.params.email };
        // console.log(query);
        const result = await bookingCollection.find(query).toArray();
        // console.log(result);
        res.send(result);
      } catch (error) {}
    });
    // delete a booking
    app.delete("/tour-booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });
    // create tour guide assign Projects
    app.post("/tour-guide-assign", async (req, res) => {
      const data = req.body;
      const result = await tourGuideCollection.insertOne(data);
      res.send(result);
    });
    // get tour info by email
    app.get("/tour-guide-assign/:email", async (req, res) => {
      try {
        const query = {
          tourGuideEmail: req.params.email,
        };
        // console.log("tourguide ", query);

        const result = await bookingCollection.find(query).toArray();
        // console.log(result);
        res.send(result);
      } catch (error) {}
    });
    // update tour guide profile
    app.put("/update/guide/:email", async (req, res) => {
      const email = req.params.email;
      const updatedData = req.body;
      const filter = { tourGuideEmail: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updatedData.name,
          educationLevel: updatedData.educationLevel,
          experience: updatedData.experience,
          contact: updatedData.contact,
          email: updatedData.email,
          assignTour: updatedData.assignTour,
        },
      };
      const result = await tourGuideCollectionList.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // get tour guide details
    app.get("/tour-guide-details/:email", async (req, res) => {
      const email = req.params.email;
      const query = { tourGuideEmail: email };
      const result = await tourGuideCollectionList.findOne(query);
      res.send(result);
    });
    // get tour
    app.get("/assign-tour", async (req, res) => {
      const result = await tourGuideCollection.find().toArray();
      res.send(result);
    });
    // change status
    app.patch("/assign-tour-status/:id", async (req, res) => {
      const id = req.params.id;
      // console.log("req.params..id", id);
      // const isExist = await tourGuideCollection.findOne({ tourId: id });
      // console.log(isExist);
      // console.log(id);
      const { status } = req.body;
      // console.log(id, status);
      const filter = { tourId: id };
      // console.log(filter);
      const updateDoc = {
        $set: {
          status: status,
        },
      };
      const result = await tourGuideCollection.updateOne(filter, updateDoc);
      // console.log(result);
      res.send({ result, updateDoc });
    });
    // update also in booking
    app.patch("/assign-tour-status-booking/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const { status } = req.body;
      const filter = { tourId: id };
      const isExist = await bookingCollection.findOne({ tourId: id });
      // console.log(isExist);
      const updateDoc = {
        $set: {
          status: status,
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // deleted also from tour-guide
    app.delete("/delete-assign-tour/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { tourId: id };
      // console.log(id);
      const result = await tourGuideCollection.deleteOne(filter);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
