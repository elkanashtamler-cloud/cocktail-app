# 🍸 Pro Bar Manager – Cocktail Explorer
Discover, plan, and manage your perfect bar experience.  
Search cocktails by ingredient, plan parties, track your bar inventory, and explore mixology tools – all in one responsive, installable web app.
---
## ✨ Key Features
- **Real‑time cocktail search**  
  Search cocktails by ingredient (e.g. Gin, Vodka, Lemon) using TheCocktailDB API, with smart ingredient matching and translations.
- **Rich cocktail details**  
  See full ingredient lists, measurements, preparation instructions, and optional YouTube video links for each drink.
- **Favorites & custom recipes**  
  Save favorite cocktails and create your own custom recipes, all stored locally in `localStorage`.
- **Party Planner**  
  Build a party cocktail list, set number of guests, and automatically calculate total ingredients needed.
- **Smart Bar Management (Inventory)**  
  Maintain a list of ingredients you already have, see “What can I make?” suggestions, and manage a shopping list.
- **Safe Drive Calculator**  
  Estimate Blood Alcohol Concentration (BAC) based on weight, gender, drinks and time passed, with a clear “do not drive” warning when above limit.
- **Analytics Dashboard**  
  Visualize your favorite ingredients with a polar chart powered by Chart.js to understand your taste profile.
- **Happy Hour Map**  
  See nearby bars and pubs on a map using Leaflet + OpenStreetMap + Overpass API.
- **Mixology Academy**  
  Learn about glass types and basic techniques (shaking, stirring, muddling, layering) with quick reference cards and tutorial links.
- **Weather‑based suggestions**  
  A small weather widget that recommends drink styles (frozen, warming, classic) based on your local temperature.
- **Fully responsive design (mobile‑first)**  
  Optimized layout for phones and tablets: mobile navigation menu, stacked search controls, and denser cocktail grid.
- **PWA support – installable app**  
  Includes `manifest.json` and a `sw.js` service worker so the app can be installed to the home screen and works offline for cached assets.
---
## 🧰 Tech Stack
### **Core**
- **Frontend**:  
  - **HTML5** – semantic structure (`index.html`)  
  - **CSS3** – custom dark & gold theme, modern layout, **Media Queries** for responsive design  
  - **JavaScript (ES6+)** – modular source (`js/*.js`), with a bundled version (`js/bundle.js`) for production
- **APIs & Data Sources**:  
  - **TheCocktailDB** – cocktail data (search by ingredient, name, categories)  
  - **Open‑Meteo / OpenWeather (fallback)** – live temperature for weather recommendations  
  - **OSM Overpass + Leaflet** – open‑source map and nearby bar locations
- **Client Storage**:  
  - **`localStorage`** – favorites, party list, custom recipes, inventory, shopping list, ingredient index cache
### **PWA & Assets**
- **PWA**:  
  - `manifest.json` – app metadata, icon, theme color  
  - `sw.js` – cache‑first service worker for offline support of HTML/CSS/JS and key images  
- **Assets**:  
  - **SVG icons** for glass types and mixology visuals (`images/academy/*.svg`)  
  - **App icon**: `images/Gemini_Generated_Image_chteoochteoochte.png` (used by manifest & favicon)
### **Deployment**
The project is a static web app and can be deployed on any static host, for example:
- **Vercel**
- **GitHub Pages**
- **Netlify**
- Any static HTTP server (Nginx/Apache/S3 + CloudFront, etc.)
---
## 📦 Project Status
- **Type**: Graduation Project  
- **Status**: **Production‑ready** for personal use and demos:
  - Secure by design: AI keys removed / stubbed, only public APIs used on the client.
  - No backend required – all logic runs in the browser.
  - Optimized for mobile (navigation, tap targets, layout).
---
## 🖥️ Local Setup
You can run the app locally either with Python, Node, or any static file server.
### 1. Clone the repository
```bash
git clone https://github.com/elkanashtamler-cloud/cocktail-app.git
cd "cocktail-app"
(If your folder name includes Hebrew characters like פרויקט גמר, make sure your shell handles UTF‑8 paths correctly.)

2. Start a local HTTP server
Option A – Using Python (recommended)
# Python 3
python -m http.server 8080
Then open:

http://localhost:8080
Option B – Using Node (serve)
npx -y serve -p 8080
Or simply run the provided batch script on Windows:

run-server.bat
This will start a server on http://localhost:8080.

Important:
Do not open index.html via file:// directly – use a local HTTP server so the PWA, service worker, and APIs behave correctly.

📱 PWA / Install Instructions
Run the project on http://localhost:8080 or deploy to a public HTTPS URL.
Open the site in a modern browser (Chrome, Edge, Safari, or mobile browsers).
Wait a moment for the service worker to register.
Use “Add to Home Screen” / “Install App” in the browser menu.
The app will then behave like a native app icon, launching in standalone mode with the configured theme color and icon.

🧪 How to Use
Search cocktails: Type an ingredient (e.g. “vodka”, “lemon”) and press Search.
Surprise Me: Click Surprise Me to get a random cocktail.
View details: Click any cocktail card to open a detailed modal with ingredients, instructions, and party scaling.
Favorites: Click the heart on a cocktail to add/remove it from Favorites, and manage them from Saved & Custom.
Party Planner: Open Party (nav), add cocktails, set guest count, and see total ingredients.
Smart Bar: Use My Bar to mark what you have, view What Can I Make?, and manage a Shopping List.
Safe Drive: Use the Safe Drive Calculator to estimate BAC and see if you should avoid driving.
Stats: Open Stats to view your favorites ingredient analytics.
Map: Open Map to see nearby bars (requires location permission).
Academy: Open Academy for quick glass & technique guides.
👥 Authors
Oriel Zukerman
Elkana Shtamler
If you have ideas, suggestions, or want to adapt this project for your own needs (different theme, additional analytics, or backend integration), feel free to fork the repository and extend it.