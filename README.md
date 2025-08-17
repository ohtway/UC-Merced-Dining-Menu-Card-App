Menu Card Maker (UC Merced • Internal)

Generate printable dining menu cards with consistent branding, allergen badges, and “contains” notes. The app runs a tiny local server and opens in your browser—no internet needed, no data leaves your machine.

Note from Oliver: This is my first app with a real Windows installer 🙌. If parts of the structure feel odd, thanks for bearing with me—PRs and suggestions welcome!

What it does

🖨️ Lays out menu cards on a letter page (10 per page, 2×5 grid)

🧾 Exports a ready-to-print PDF

⚠️ Supports allergen & attribute badges (Halal, Vegan, Caffeine, etc.)

🅰️ Uses UC Merced dining branding assets and campus fonts (internal use)

Who this is for

UC Merced Dining & Retail Services staff. This repo, icons, and fonts are internal-only (not open source / not for redistribution).

Install (Windows)

Go to Releases (right-hand sidebar in GitHub) and download the latest installer:
Menu Card Maker-X.Y.Z.exe

Double-click the installer.

Choose an install folder (per-user install; admin rights not required).

Finish. A Start Menu shortcut named Menu Card Maker will be created.

The app bundles its own Java runtime. You do not need Java installed.

Run

From the Start Menu, open Menu Card Maker.

The app starts locally and automatically opens your browser to:
http://127.0.0.1:8080/

If a window doesn’t open, manually visit the URL above. The app only listens on localhost (your machine).

Uninstall

Windows Settings → Apps → Installed apps → Menu Card Maker → Uninstall.

Using the app (quick tour)

Fill in the dish name, choose attributes (e.g., Vegan/Halal/Caffeine), and list allergens or other “contains” items (colors/textures).

Click Export to download a PDF laid out for printing.

Each page fits 10 cards. Long text is wrapped and truncated gracefully.

Privacy & security

The app binds to 127.0.0.1 (loopback). It’s not accessible from the network.

No telemetry. PDFs are generated on your machine; nothing is uploaded.

Troubleshooting

The app didn’t open in a browser.
Open: http://127.0.0.1:8080/ in Chrome/Edge. If it still fails:

Another app might be using port 8080. Try launching with a different port:

Create a shortcut to the app and add this JVM option to the Arguments field:
--jvm "-DPORT=9090"

Then visit http://127.0.0.1:9090/.

Windows SmartScreen warning.
Click More info → Run anyway (internal app). If that’s a blocker, contact Oliver for a signed build.

PDF doesn’t show icons or fonts.
Make sure you installed the latest release; the installer bundles required assets.

For developers (internal)
Repo layout
server/                         # Java server + web UI in resources
  src/main/java/ucm/menu/...    # ExportServer.java, Card.java
  src/main/resources/menu-card-web/{index.html, app.js, styles.css, assets/...}
scripts/                        # build scripts
packaging/icon.ico              # installer icon
archive/                        # old prototypes (not used)

Build from source (dev run)

Requirements: JDK 17+, Maven 3.8+.

# from repo root
.\scripts\dev-run.ps1 -Port 8080
# or:
cd server
mvn clean package
java -DPORT=8080 -jar target\menu-export-server-1.0.0-shaded.jar

Build the Windows installer (EXE)
# from repo root
powershell -ExecutionPolicy Bypass -File .\scripts\build-installer.ps1
# output: server\target\dist\Menu Card Maker-X.Y.Z.exe


The installer is produced via jpackage (Maven plugin) and includes a trimmed Java runtime, so it runs on any Windows 10/11 machine without external dependencies.

Known limits / future ideas

Page layout is fixed to 10 cards per page (2×5).

Fonts & icons are internal campus assets; not licensed for public release.

Potential enhancements: custom page sizes, CSV import, batch styles.

Support / contact

Questions, bugs, or ideas: open an Issue on this repo or reach out to Oliver directly. Screenshots and the exact steps you took are super helpful.

Thanks for using Menu Card Maker and helping improve it!
