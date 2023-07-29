module.exports = function (app) {
  var thingsController = require("../controllers/things");

  app.get("/api/v1/things", thingsController.findAll);
  app.get("/api/v1/things/:id", thingsController.findById);
  app.post("/api/v1/things", thingsController.add);
  app.put("/api/v1/things/:id", thingsController.update);
  app.delete("/api/v1/things/:id", thingsController.delete);
  app.get("/api/v1/thingsCount/", thingsController.count);
  app.get("/api/v1/thingsInc/:id", thingsController.increment);
  app.get("/api/v1/thingsActivity", thingsController.activity);

  thingsController.setDBConnectionsFromApp(app);
};
