# Pro Bar Manager

A **graduation project** — a web app for discovering cocktails, managing your bar, and planning parties.

---

## Features

- **Search by ingredient** — Find cocktails by typing any ingredient (e.g. Gin, Vodka, Lemon).
- **Surprise Me** — Get a random cocktail suggestion.
- **Favorites & custom recipes** — Save favorite cocktails and create your own recipes.
- **Party Planner** — Add cocktails to a party list, set guest count, and see total ingredients needed.
- **Smart Bar (Inventory)** — Track what you have, see “What can I make?”, and manage a shopping list.
- **Safe Drive Calculator** — Estimate BAC (gender, weight, drinks, time) with an Israel limit reminder.
- **Analytics Dashboard** — View a chart of your favorite ingredients (from saved cocktails).
- **Happy Hour Map** — Find bars and pubs near you (location-based) with Leaflet + OpenStreetMap.
- **Mixology Academy** — Short guide to glass types and techniques (shaking, stirring, muddling, etc.).
- **AI Cocktail Assistant** — Chat for suggestions, bar recommendations, and cocktail questions (Gemini).
- **Weather-based suggestions** — Drink recommendations based on your local weather.

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| **Markup**  | HTML5      |
| **Styling** | CSS3       |
| **Logic**   | Vanilla JavaScript (ES modules, bundled) |
| **APIs**    | TheCocktailDB, Open-Meteo / OpenWeather, OSM Overpass |
| **Libraries** | Leaflet (maps), Chart.js (analytics) |
| **AI**      | Google Gemini (Generative AI) |
| **Storage** | `localStorage` (favorites, custom recipes, inventory, shopping list) |

---

## How to Run

1. Open the project folder and serve it over HTTP (e.g. run `run-server.bat` or use any static server).
2. Open `index.html` in a browser (or via the server URL).
3. Allow location when prompted for weather and map features.

---

## Authors

Oriel Zukerman · Elkana Shtamler
