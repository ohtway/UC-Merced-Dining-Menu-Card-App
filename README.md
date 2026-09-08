Menu Card Maker (UC Merced • Internal)

## Windows preview 2.0.2

[**Download the Windows installer (.exe)**](https://github.com/ohtway/UC-Merced-Dining-Menu-Card-App/releases/download/v2.0.2/Menu-Card-Maker-2.0.2-PREVIEW-win-x64.exe) · [Windows checksum](https://github.com/ohtway/UC-Merced-Dining-Menu-Card-App/releases/download/v2.0.2/SHA256SUMS-2.0.2-win.txt) · [Release notes and all downloads](https://github.com/ohtway/UC-Merced-Dining-Menu-Card-App/releases/tag/v2.0.2)

For **Windows 10/11 x64**. Run the installer, then open **Menu Card Maker** from the desktop or Start Menu. Version 2 opens its own desktop window without Java, Node, or a browser and uses the same app icon as the Mac build. This preview is **unsigned**; Windows may show an unknown-publisher or SmartScreen notice.

The app asks when a newer Windows installer is available on GitHub. Choose **Download Windows installer**, close the app normally to save your work, then run the downloaded EXE using the existing installation folder. Version 2 upgrades replace old application files and preserve saved menus and drafts. You can also check for updates from the version button. This preview uses manual installer updates.

Existing Windows 1.x users need a one-time version 2 installation. The legacy Java/browser app and its browser data are not automatically migrated or removed; verify/export needed content before uninstalling the old app through Windows Settings.

## Mac preview 2.0.2

[**Download the Mac installer (.dmg)**](https://github.com/ohtway/UC-Merced-Dining-Menu-Card-App/releases/download/v2.0.2/Menu-Card-Maker-2.0.2-LOCAL-TEST-mac-universal.dmg) · [Release notes, ZIP, and checksums](https://github.com/ohtway/UC-Merced-Dining-Menu-Card-App/releases/tag/v2.0.2)

For **macOS 12 or later**, with one universal app for **Apple Silicon and Intel**. Open the DMG, drag Menu Card Maker into Applications, and launch it. Version 2 opens its own desktop window without Terminal or a browser. This update simplifies the item-name field to one rounded focus border and vertically centers a single preview page when there is room. Multiple pages scroll normally. Card text remains centered when badges leave room, with collision protection in the preview and exported PDF.

This preview is **unsigned and unnotarized**. macOS may block its first launch. Automatic updates are disabled; install newer previews manually. The `LOCAL-TEST` download name identifies this build type.

The existing **Windows v1.0.2** release remains available separately. Version 2 development and handoff notes live in the [development repository](https://github.com/ohtway/UC-Merced-Dining-Menu-Card-App-Dev).

## Legacy Windows v1.0.2 reference

The screenshots, browser-based instructions, and Java build notes below describe the older Windows application, not the version 2 previews above.

![Menu Card Maker](https://github.com/user-attachments/assets/a42f2fff-e88c-4497-acef-34c78aa4a19d)
![Menu Card Maker (1)](https://github.com/user-attachments/assets/e6793137-4001-43f1-af8c-858b28f3a19a)
![Menu Card Maker (2)](https://github.com/user-attachments/assets/f8af5661-64ef-4b3c-b4a5-6fd87be882e4)


Generate printable dining menu cards with consistent branding, allergen badges, and “contains” notes. The app runs a tiny local server and opens in your browser—no internet needed, no data leaves your machine.

Note from Oliver: This is my first app with a real Windows installer 🙌. If parts of the structure feel odd, thanks for bearing with me—PRs and suggestions welcome!

![Menu Card Maker (3)](https://github.com/user-attachments/assets/4cfd3a73-4228-4a36-a76f-338a5b832731)

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
