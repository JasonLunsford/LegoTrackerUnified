const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Pull in environmental variables, store in process.env
require('dotenv').config();

// Enable express and CORS
const app = express();

let corsOptions = {
    origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

// Parse incoming query strings and POST messages, convert into JSON
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

// Connect to db
const db = require('./models');
const dbConfig = require('./config/db.config');
const { initializeDb } = require('./middleware');

db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true
  })
  .then(() => {
        console.log("Connected to MongoDB successfully.");

        // Install Default Roles and Users
        initializeDb.initializeDb();
  })
  .catch(err => {
        console.error("Connection error", err);
        process.exit();
  });

require('./routes/auth.routes')(app);
require('./routes/pieces.routes')(app);
require('./routes/sets.routes')(app);
require('./routes/userPieces.routes')(app);
require('./routes/userSets.routes')(app);

// Global failure route
app.all('/*', (req, res) => {
	res.status(500).send({status: 500, error: 'Invalid endpoint.'});
});

// Catch random UnhandledRejection
process.on('unhandledRejection', error => {
    console.log('unhandledRejection: ', error.message);
});

const PORT = process.env.PORT || 8181
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
