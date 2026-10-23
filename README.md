# Teller & Plan

Gemeinsame Essensauswahl aus Teller-Match und Ernährungsplanung aus Meal-Scaler, im Repository **meal-scaler**.

Live: **https://whats4dinner.party** (bestehende GitHub-Pages-Adresse dieses Repositorys).

## Auf euren Handys

1. Unter **Wischen** Daniel oder Stina auswählen.
2. Auf dem ersten Handy unter **Mehr → Gemeinsamen Bereich erstellen** starten und die zweite Person über den einmaligen Einladungslink hinzufügen. Auf dem zweiten Handy den Link öffnen und die Einladung annehmen. Nicht zwei getrennte Bereiche erstellen. Ihr startet neu; eine Übernahme aus den bisherigen Apps ist nicht vorgesehen.
3. **Mein Ziel**: Daniel und Stina speichern jeweils ihr eigenes Tagesziel. Jede Person kann nur ihr eigenes Ziel ändern. Nur die Ziele sind gemeinsam sichtbar; persönliche Profilangaben bleiben pro Platz geschützt.
4. Ein Match öffnen oder unter **Plan** ein Gericht suchen. Zutaten für eine Grundportion prüfen, Faktoren für beide Personen einstellen und einem Wochentag hinzufügen.
5. Im Wochenplan stehen beide Kalorienbilanzen und unter **Einkauf** die summierten Mengen. „Meine Mengen … skalieren“ verändert ausschließlich den eigenen Portionsanteil dieses Tages.

Die 72 bestehenden Gericht-IDs bleiben erhalten. Alle 72 Gerichte haben Mengen und Kochschritte. Eigene Gerichte und Foto-Uploads bleiben unter **Mehr** verfügbar; ihre Rezeptmengen können anschließend ergänzt werden. Nährwerte sind Näherungswerte je Lebensmittel und können von Verpackungsangaben abweichen. Bilder sind Servierbeispiele, keine verbindlichen Zutatenlisten; Credits stehen am Rezept und in `public/BILDNACHWEISE.md`.

## Architektur und Datenschutz

- React/Vite stellt die gemeinsame Navigation, Rezeptansicht, persönliche Ziele, Wochenplan, Einkaufsliste und KI-Rezept-Assistent bereit.
- `public/match/` enthält die bewährte Teller-Match-Oberfläche mit eigenem Offline-Speicher. Sie läuft im selben Origin in einer eingebetteten Ansicht und ist über einen strikt auf `location.origin` und das konkrete Fenster eingeschränkten Nachrichtenkanal verbunden. Damit bleiben Fotoverarbeitung, Swipe-Verhalten und bisherige Speicherformate erhalten.
- Bestehendes Supabase-Projekt `teller-match` in Frankfurt. Keine neuen kostenpflichtigen Ressourcen.
- Tabellen `tm_*`, vorhandene Mitgliedschaften und privater Bucket `tm-photos` bleiben unverändert. Die zusätzliche Tabelle `mp_records` enthält gemeinsame Rezepte/Mahlzeiten, gemeinsam sichtbare persönliche Ziele und nur für die jeweilige Person lesbare Profile. Browser haben ausschließlich SELECT-Rechte; RPC-Funktionen prüfen alle Schreibrechte serverseitig.
- Realtime plus Nachladen bei Wiederverbindung; dauerhafte Offline-Warteschlange. Versionsprüfung verhindert Überschreiben neuerer Daten. Bei Konflikten bleibt die neuere Version erhalten und die App fordert zur erneuten Änderung auf. Gelöschte Mahlzeiten bleiben als Tombstones erhalten und können durch alte Warteschlangeneinträge nicht wiederhergestellt werden.
- Fotos bleiben privat und werden mit kurzlebigen signierten URLs angezeigt.
- Die öffentliche Konfiguration enthält nur URL und Publishable Key, keine Verwaltungs- oder Einladungsschlüssel.
- Der vorhandene Cloudflare-Rezept-Dienst bleibt ausschließlich für KI-Anfragen eingebunden. KI-Ergebnisse werden anhand der erlaubten Lebensmittel-IDs, Zahlenbereiche und Ausschlüsse geprüft. Ausschlüsse berücksichtigen auch Roh-/Gegart-Unterschiede und einige Synonyme; zusammengesetzte Fertigprodukte müssen anhand ihrer Packungszutaten geprüft werden.

## Entwicklung und Veröffentlichung

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

GitHub Actions prüft Tests, Lint und Build und veröffentlicht `dist` nach GitHub Pages. `public/CNAME` bleibt erhalten.

Die Migrationen werden der Reihe nach angewendet. **Die erste Migration ist bereits im bestehenden Projekt installiert und darf dort nicht erneut ausgeführt werden.** Die zweite Migration ergänzt ausschließlich Planung und persönliche Ziele. Zum Neuaufbau einer lokalen Testdatenbank werden beide verwendet.

Opt-in-Live-Test (legt eigene private Testkonten und einen separaten Testbereich an):

```sh
TM_RUN_LIVE=1 node tests/live.mjs
```

Der Test prüft Paarung, Realtime-Bewertungen und -Mahlzeiten, getrennte Ziele, privaten Fotoabruf, Zugriffsschutz, Einladungen, Reset, veraltete Änderungen sowie Gerätewiederherstellung. Er verändert keinen bestehenden Nutzerbereich.
