const express = require("express");
const session = require("express-session");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 3000;

const originalLog = console.log;
console.log = function () {
  const timestamp = new Date().toISOString();
  originalLog.apply(console, [`[${timestamp}]`, ...arguments]);
};

const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error(
      "Fehler beim Verbinden mit der SQLite-Datenbank:",
      err.message
    );
  } else {
    console.log("Verbunden mit der SQLite-Datenbank.");
    db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`);
    db.run(`CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    db.run(
      `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
      ["testuser", "testpass"],
      (err) => {
        if (err)
          console.log(
            "Testuser konnte nicht hinzugefügt werden (existiert vielleicht schon).",
            err.message
          );
      }
    );
  }
});

// Einen Angreifer user hinzufügen
db.run(
  `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
  ["attacker", "attackerpass"],
  (err) => {
    if (err)
      console.log(
        "Angreifer user konnte nicht hinzugefügt werden (existiert vielleicht schon).",
        err.message
      );
  }
);

// Alte Posts löschen (um die DB sauber zu halten für neue Tests)
db.run(`DELETE FROM posts`, (err) => {
  if (err) console.log("Fehler beim Löschen der Posts:", err.message);
});

app.use(
  session({
    secret: "hier_ein_sehr_langer_und_zufaelliger_geheimer_string_verwenden",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  console.log(
    `Eingehender Request: ${req.method} ${req.originalUrl} von IP: ${clientIp}`
  );

  if (req.method === "POST" && req.body && Object.keys(req.body).length > 0) {
    console.log(
      `  Body-Daten: ${JSON.stringify(req.body).substring(0, 100)}...`
    );
  }
  next();
});

app.get("/", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/dashboard");
  } else {
    res.render("login", { message: "" });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { message: "" });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, user) => {
      if (err) {
        console.error(err.message);
        return res.render("login", { message: "Ein Fehler ist aufgetreten." });
      }
      if (user) {
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.loggedIn = true;
        console.log(`Benutzer '${username}' erfolgreich eingeloggt.`);
        res.redirect("/dashboard");
      } else {
        console.log(
          `Login-Versuch fehlgeschlagen für Benutzer: '${username}'.`
        );
        res.render("login", {
          message: "Ungültiger Benutzername oder Passwort.",
        });
      }
    }
  );
});

app.get("/dashboard", (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }
  db.all("SELECT * FROM posts ORDER BY timestamp DESC", [], (err, posts) => {
    if (err) {
      console.error(err.message);
      return res.send("Fehler beim Laden der Posts.");
    }
    console.log(`Dashboard für Benutzer '${req.session.username}' aufgerufen.`);
    res.render("dashboard", { username: req.session.username, posts: posts });
  });
});

app.post("/addpost", (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/login");
  }
  const { content } = req.body;
  const author = req.session.username;

  db.run(
    `INSERT INTO posts (author, content) VALUES (?, ?)`,
    [author, content],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.send("Fehler beim Hinzufügen des Posts.");
      }
      console.log(
        `Post von '${author}' erfolgreich in DB gespeichert (ID: ${this.lastID}).`
      );
      res.redirect("/dashboard");
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Fehler beim Logout:", err);
    }
    console.log(`Benutzer '${req.session.username}' erfolgreich ausgeloggt.`);
    res.redirect("/login");
  });
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});
