const express = require("express");
const mustacheExpress = require("mustache-express");
const Pool = require("pg").Pool;
const app = express();
const port = process.env.PORT || 3010;
const multer = require("multer");
const upload = multer({ dest: "public/uploads/" });
const sessions = require("express-session");
//Hash für Passwortschutz//
const bcrypt = require("bcrypt");

app.engine("mustache", mustacheExpress());
app.set("view engine", "mustache");
app.set("views", __dirname + "/views");

app.use(
  sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: 86400000, secure: false },
    resave: false
  })
);

const pool = new Pool({
  user: "postgres",
  host: "168.119.168.41",
  database: "dashboard",
  password: "cff5bbc6e9851d8d8d05df294755b844",
  port: 5432
});

app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));

//Main Page//

app.get("/", (req, res) => {
  if (!req.session.benutzerid) {
    res.redirect("/login_form");
    return;
  }
  pool.query("SELECT * FROM bookmarks", (err, result) => {
    console.log(result.rows);
    res.render("index", { bookmarks: result.rows });
  });
});

//Login//
app.get("/login_form", function (req, res) {
  res.render("login_form");
});

//Hier wird die Email mit den Datenbank einträgen verglichen.//
app.post("/login", function (req, res) {
  pool.query(
    "SELECT * FROM users WHERE email = $1",
    [req.body.email],
    (error, result) => {
      if (error) {
        throw error;
      }
      //Hier wird überprüft, ob das eingegebene Passwort mit der eingegebenen Email adresse übereinstimmt//
      if (bcrypt.compareSync(req.body.passwort, result.rows[0].passwort)) {
        req.session.benutzerid = result.rows[0].id;
        res.redirect("/");
      } else {
        res.redirect("/login_form");
      }
    }
  );
});

//sign up//
app.get("/registration_form", (req, res) => {
  res.render("registration_form");
});

//definieren wo Hash gespeichert wird//
app.post("/register", function (req, res) {
  var passwort = bcrypt.hashSync(req.body.passwort, 10);
  pool.query(
    "INSERT INTO users (email, passwort) VALUES ($1, $2)",
    [req.body.email, passwort],
    (error, result) => {
      if (error) {
        throw error;
      }
      res.redirect("/new");
    }
  );
});

//Add new Bookmark//
app.get("/new", (req, res) => {
  res.render("new");
});

// Add new Formular Daten in Datenbank hochladen

app.post("/new", upload.single("icon"), (req, res) => {
  pool.query(
    "INSERT INTO bookmarks (name, url, icon) VALUES ($1, $2, $3)",
    [req.body.name, req.body.url, req.file.filename],
    (err, result) => {
      res.redirect("/");
    }
  );
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
