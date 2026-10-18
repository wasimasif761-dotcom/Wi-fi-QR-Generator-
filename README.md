# 📶 Wi-Fi QR Generator (PWA)

A complete, production-ready, standalone **Progressive Web App (PWA)** to generate, scan, and print Wi-Fi connection QR codes. 

**Developed By Waseem Asif**

---

## 🚀 Key Features

- **100% Client-Side & Pure Vanilla JS**: Zero backend server, zero external APIs, zero build steps required.
- **PWA & Offline Capable**: Works without an internet connection using Service Worker (`sw.js`) and Web App Manifest (`manifest.json`).
- **Standard Wi-Fi Protocol**: Produces standard `WIFI:T:[Security];S:[SSID];P:[Password];H:[Hidden];;` payloads supported natively by iOS and Android camera apps.
- **Security Support**:
  - WPA / WPA2 / WPA3
  - WEP
  - Open Networks (None / nopass)
  - Hidden Networks (hidden SSID)
- **High-Resolution PNG Download**: One-click download of a branded access pass card with network details.
- **Print Friendly**: Built-in desk tent / guest card print view.
- **Professional Customization**:
  - Customizable QR themes (Dark Slate, Navy Blue, Emerald Green, Indigo)
  - Configurable Error Correction (Low, Medium 15%, High 30%)
  - Resolution scaling (260px, 320px, 420px)
  - Live auto-generation as you type

---

## 📁 Repository Structure

```text
├── index.html        # Main application layout and styles
├── app.js            # Pure JavaScript QR engine & PWA logic
├── manifest.json     # PWA manifest configuration
├── sw.js             # Service Worker for offline caching
├── icon.svg          # High-resolution vector Wi-Fi icon
├── .nojekyll         # Disables Jekyll processing for GitHub Pages
└── README.md         # Documentation
```

---

## 🌐 Deploy to GitHub Pages (Step-by-Step)

### Option 1: Via GitHub Web Interface
1. Create a new repository on GitHub (e.g., `wifi-qr-generator`).
2. Upload the project files (`index.html`, `app.js`, `manifest.json`, `sw.js`, `icon.svg`, `.nojekyll`, `README.md`) directly to the root of the repository.
3. Commit the files to the `main` branch.
4. Go to repository **Settings** &rarr; **Pages** (on the left menu).
5. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **`main`** / Folder: **`/(root)`**
6. Click **Save**.
7. In about 1 minute, your site will be live at:
   `https://<your-username>.github.io/wifi-qr-generator/`

### Option 2: Via Git Command Line
```bash
git init
git add .
git commit -m "Initial release of Wi-Fi QR Generator PWA"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```
Then enable GitHub Pages from repository **Settings** &rarr; **Pages**.

---

## 👨‍💻 Developer & Feedback

**Developed By Waseem Asif**  
*Software Engineer & Full-Stack Developer*

- **WhatsApp (Yemen):** [+967 597447275](https://wa.me/967597447275)
- **WhatsApp (Yemen):** [+967 597440515](https://wa.me/967597440515)
- **WhatsApp (Pakistan):** [+92 322 4994773](https://wa.me/923224994773)
- **Email:** [wasimasif761@gmail.com](mailto:wasimasif761@gmail.com)

---

## 📄 License
MIT License. Free to use, modify, and distribute.
