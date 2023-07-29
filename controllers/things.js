const axios = require("axios");
const { ObjectId } = require("mongodb");

let dbConnection;
let thingsCollection;
let logger;

exports.setDBConnectionsFromApp = function (app) {
  logger = app.get("logger");
  logger.info("things controller setDBConnectionFromApp Started");
  dbConnection = app.get("dbConnection");
  thingsCollection = dbConnection.collection("things");
};

function mapThing(thing) {
  return {
    id: thing._id.toString(),
    name: thing.name,
    activity: thing.activity ? thing.activity : 0,
  };
}

exports.findAll = async (req, res) => {
  res.type("application/json");

  logger.info("things controller findAll Started");

  const thingsCursor = thingsCollection.find({}).sort({ name: 1 });

  const thingValues = await thingsCursor.toArray();

  let mappedThingValues = thingValues.map((thing) => {
    return mapThing(thing);
  });

  if (mappedThingValues == null) {
    mappedThingValues = [];
  }

  logger.info(
    "things controller findAll found " + mappedThingValues.length + " things"
  );

  res.status(200);
  res.json({ things: mappedThingValues });
};

exports.findById = async (req, res) => {
  res.type("application/json");

  const idParam = req.params.id;

  logger.info("things controller findById Started. idParam: " + idParam);

  // check for valid Object(ID)
  var objID;
  try {
    objID = new ObjectId(idParam);
  } catch (err) {
    logger.error(err.toString());
    logger.info(
      "things controller findById invalid object id. idParam: " + idParam
    );
    res.status(500);
    res.send({ success: false, msg: "invalid object id - " + idParam });
    return;
  }

  const query = { _id: objID };

  const thing = await thingsCollection.findOne(query);

  if (thing) {
    logger.info("things controller findById Found. idParam: " + idParam);
    res.status(200);
    res.json(mapThing(thing));
  } else {
    logger.info("things controller findById Not Found. idParam: " + idParam);
    res.status(404);
    res.json({ success: false, msg: "item not found" });
  }
};

exports.add = async (req, res) => {
  res.type("application/json");

  var item = req.body;
  var newThing = {};
  newThing.name = req.body.name;

  // check to see if the item already exists. If so skip the insert.
  const dbThing = await thingsCollection.findOne({ name: newThing.name });

  if (dbThing) {
    logger.error("Failed. Duplicate Name");
    res.status(400);
    res.json({ success: false, message: "Duplicate Name" });
    return;
  }

  var result = await thingsCollection.insertOne(newThing);

  logger.info(`A document was inserted with the _id: ${result.insertedId}`);

  logger.info(result);
  logger.info(newThing);

  // HTTP Status Created
  res.status(201);
  res.json(mapThing(newThing));
};

exports.update = async (req, res) => {
  res.type("application/json");

  const idParam = req.params.id;

  logger.info("things controller update Started. idParam: " + idParam);

  logger.info(req.body);

  const updateThing = req.body;

  // check for valid Object(ID)
  let objID;
  try {
    objID = new ObjectId(idParam);
  } catch (err) {
    logger.error(err.toString());
    logger.info(
      "things controller update invalid object id. idParam: " + idParam
    );
    res.status(500);
    res.send({ success: false, msg: "invalid object id - " + idParam });
    return;
  }

  // Make sure id is not in the object
  delete updateThing.id;

  const result = await thingsCollection.updateOne(
    { _id: objID },
    { $set: updateThing }
  );

  if (result.modifiedCount === 1) {
    logger.info("Successfully updated one document.");
    res.status(200);
    res.json({ success: true, message: "Item Updated" });
  } else {
    logger.info("No documents matched the query. Updated 0 documents.");
    res.status(400);
    res.send({ success: false, msg: "Failed to update" });
  }
};

exports.delete = async (req, res) => {
  res.type("application/json");

  const idParam = req.params.id;

  logger.info("things controller delete Started. idParam: " + idParam);

  // check for valid Object(ID)
  var objID;
  try {
    objID = new ObjectId(idParam);
  } catch (err) {
    logger.error(err.toString());
    logger.info(
      "things controller delete invalid object id. idParam: " + idParam
    );
    res.status(500);
    res.send({ success: false, msg: "invalid object id - " + idParam });
    return;
  }

  const query = { _id: objID };

  const result = await thingsCollection.deleteOne(query);

  if (result.deletedCount === 1) {
    logger.info("Successfully deleted one document.");
    res.status(200);
    res.json({ success: true, message: "Item Deleted" });
  } else {
    logger.info("No documents matched the query. Deleted 0 documents.");
    res.status(400);
    res.send({ success: false, msg: "Failed to delete" });
  }
};

exports.count = async (req, res) => {
  res.type("application/json");

  logger.info("things controller count Started.");

  const query = {};

  const countThings = await thingsCollection.countDocuments(query);

  res.status(200);
  res.json({ count: countThings });
};

exports.increment = async (req, res) => {
  res.type("application/json");

  const idParam = req.params.id;

  logger.info("things controller increment Started. idParam: " + idParam);

  // check for valid Object(ID)
  var objID;
  try {
    objID = new ObjectId(idParam);
  } catch (err) {
    logger.error(err.toString());
    logger.info(
      "things controller increment invalid object id. idParam: " + idParam
    );
    res.status(500);
    res.send({ success: false, msg: "invalid object id - " + idParam });
    return;
  }

  const incThingActivity = { activity: 1 };
  const result = await thingsCollection.updateOne(
    { _id: objID },
    { $inc: incThingActivity }
  );

  res.status(200);
  res.json({ updatedRecords: result.modifiedCount });
};

exports.activity = async (req, res) => {
  res.type("application/json");

  logger.info("things controller activity Started.");

  try {
    let response = await axios.get("https://www.boredapi.com/api/activity");
    logger.info(
      "things controller activity Found. activity: " + response.data.activity
    );
    res.status(200);
    res.json({ todaysActivity: response.data.activity });
  } catch (error) {
    res.status(404);
    res.json({ success: false, msg: "no activity found" });
  }
};
