/* ─────────────────────────────────────────────
   Everything the map and the ask box know.

   rings    the four orbits on the map, inside to outside
   nodes    the points on each orbit; `keys` are extra words visitors
            might use for it, `section` is where it's written up below
   edges    which points are related; drawn as lines on the map
   answers  scripted replies; `nodes` are the points they light up
   lenses   what changes for a recruiter, client or faculty visitor

   To add a project: add a node to the "work" ring, a few edges, and an
   answer that mentions it. Keep llms.txt in step.
   ───────────────────────────────────────────── */

window.PORTFOLIO = {
  name: "Jonathan Cercenina Ramirez",
  // the shorter name at the centre of the map
  mapName: "Jonathan",

  // Commits per week on the thesis repository (Monday to Sunday), from git log.
  // Milestones are dated commits, reworded.
  build: {
    start: "2026-04-13",
    weeks: [2, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 22, 8, 15, 7, 3, 5, 22, 31],
    phases: [
      { label: "UI prototype", from: 0, to: 15 },
      { label: "Working system", from: 16, to: 23 },
    ],
    milestones: [
      { week: 0, date: "19 Apr", text: "The UI prototype begins" },
      { week: 16, date: "4 Aug", text: "The prototype becomes a working PHP and MySQL system", node: "office" },
      { week: 16, date: "6 Aug", text: "A Windows installer that runs on a machine that has never had XAMPP", node: "installer" },
      { week: 18, date: "23 Aug", text: "The Android app arrives, with its own API and QR payments", node: "android-app" },
      { week: 20, date: "1 Sep", text: "A permanent public address, refreshed on every start", node: "remote" },
      { week: 21, date: "13 Sep", text: "Backups, and putting a backup back", node: "restore" },
      { week: 22, date: "15 Sep", text: "Sign-in throttling on all three doors", node: "throttle" },
      { week: 23, date: "21 Sep", text: "An audit, and the fixes for what it found", node: "roles" },
      { week: 23, date: "25 Sep", text: "A dashboard of what's waiting on staff", node: "office" },
    ],
  },

  // the point at the centre of the map
  core: {
    text: "Full-stack developer. Everything on this map connects back here: the work I've built, the problems it made me solve, what I can build for you, and the tools I used.",
    section: "#about",
  },

  rings: [
    { id: "work", label: "Thesis", note: "Cable Manager, part by part", radius: 2.5, tilt: [0.04, -0.03], speed: 0.05, shape: "octa" },
    { id: "projects", label: "Projects", note: "Other things I've built", radius: 3.9, tilt: [0.05, -0.05], speed: -0.04, shape: "cube" },
    { id: "solved", label: "Solved", note: "Hard problems, and what I did", radius: 5.3, tilt: [-0.07, 0.05], speed: 0.03, shape: "ring" },
    { id: "services", label: "Services", note: "What I can build for you", radius: 6.7, tilt: [0.06, 0.07], speed: -0.022, shape: "diamond" },
    { id: "tools", label: "Tools", note: "What I've shipped with", radius: 8.1, tilt: [-0.03, -0.06], speed: 0.015, shape: "dot" },
  ],

  nodes: [
    // Work
    { id: "office", ring: "work", label: "Office system", keys: ["office", "desktop", "windows", "server"], section: "#work",
      text: "A single Windows installer that ships its own Apache, MariaDB and PHP. It runs on one office computer with no internet connection and nothing else installed." },
    { id: "portal", ring: "work", label: "Subscriber portal", keys: ["portal", "website", "pwa", "subscriber", "subscribers"], section: "#work",
      text: "Where subscribers see their bills, report payments and follow their requests to the office as a conversation. It installs on a phone like an app." },
    { id: "android-app", ring: "work", label: "Android app", keys: ["android", "mobile", "phone", "phones", "apk"], section: "#work",
      text: "Native Kotlin with Jetpack Compose. Reminders, QR payment, PDF receipts and two connection tests. It still shows the balance when the office computer is off." },
    { id: "remote", ring: "work", label: "Remote access", keys: ["remote", "access", "outside", "https", "dns", "funnel"], section: "#work",
      text: "Tailscale Funnel gives the portal and app a permanent HTTPS address with no router setup. The launcher re-registers it every time the system starts." },

    // Solved
    { id: "restore", ring: "solved", label: "Atomic restore", keys: ["restore", "restores", "atomic", "transaction", "recover"], section: "#work",
      text: "Every restore takes a safety copy first, then refills tables inside one transaction, so it either finishes completely or changes nothing. It refuses the wrong file before touching anything." },
    { id: "throttle", ring: "solved", label: "Sign-in throttling", keys: ["throttling", "throttle", "lockout", "brute", "login", "sign-in"], section: "#work",
      text: "Failed sign-ins are counted per account and per address on all three ways in. Lockouts double up to 30 minutes, and every lock is written to the audit trail." },
    { id: "offline", ring: "solved", label: "Offline-first app", keys: ["offline", "cache", "cached", "outage"], section: "#work",
      text: "The Android app keeps the last answer it was given, so a subscriber never faces a blank screen when the office computer is off for the night." },
    { id: "installer", ring: "solved", label: "One-file installer", keys: ["installer", "install", "setup", "launcher", "deploy", "deployment"], section: "#work",
      text: "Web server, database and PHP in one setup file. The launcher migrates the schema, takes a backup, keeps the thirty most recent and shuts everything down cleanly." },
    { id: "roles", ring: "solved", label: "Four roles", keys: ["roles", "permissions", "access control", "admin", "bookkeeper", "staff"], section: "#work",
      text: "Administrator, bookkeeper, staff and subscriber, checked on the server for every page rather than by hiding buttons." },
    { id: "tests", ring: "solved", label: "Automated tests", keys: ["test", "tests", "testing", "tested", "quality"], section: "#work",
      text: "Eleven test files, one command, no dependencies. Every run rebuilds a throwaway database, so real records are never touched." },

    // Services
    { id: "svc-business", ring: "services", label: "Business systems", keys: ["billing", "inventory", "records", "reports"], section: "#services",
      text: "Billing, inventory, records and reports for a small office, with roles so each person sees only their part." },
    { id: "svc-portal", ring: "services", label: "Customer portals", keys: ["customer", "customers", "portal"], section: "#services",
      text: "A website your customers sign into to see bills, pay and ask for help. Installable on a phone like an app." },
    { id: "svc-android", ring: "services", label: "Android apps", keys: ["android", "app", "apps"], section: "#services",
      text: "Native Kotlin apps that talk to your system, send reminders, and keep working on a bad connection." },
    { id: "svc-setup", ring: "services", label: "Hands-off setup", keys: ["maintenance", "backups", "unattended"], section: "#services",
      text: "One-file installers, automatic backups and remote access, so the system runs without anyone babysitting it." },

    // Projects
    { id: "p-arts", ring: "projects", label: "Arts & Design Showcase", keys: ["arts", "art", "artwork", "artists", "gallery", "showcase"], section: "#projects",
      text: "Solo project. A gallery where visitors browse artworks and artist profiles, search, and send messages, with an admin area for managing artists and artworks." },
    { id: "p-auction", ring: "projects", label: "Auction Market", keys: ["auction", "auctions", "bidding", "bid", "bids"], section: "#projects",
      text: "Solo project. An online auction: sellers list items, buyers bid, the current bid updates without reloading the page, and an admin sees the analytics." },
    { id: "p-court", ring: "projects", label: "St. Francis Court", keys: ["court", "courts", "booking", "bookings", "st francis", "reservation"], section: "#projects",
      text: "Solo project. Court booking: players book and edit their slots, and the admin sees court usage, monthly bookings and revenue trends." },
    { id: "p-pucu", ring: "projects", label: "PUCU Event Calendar", keys: ["pucu", "event calendar", "calendar", "events", "pec"], section: "#projects",
      text: "Team project, where I was a programmer. A school event calendar: organisations get their own dashboard, admins manage users, and events show as upcoming, pending or recently finished." },
    { id: "p-campus", ring: "projects", label: "ITE 393 Campus App", keys: ["campus", "ite 393", "ite393", "floor", "floors"], section: "#projects",
      text: "Team project, where I was a programmer. An Android campus companion: sign-in, student profiles, a floor-by-floor building map, events, courses and modules, on Firebase." },
    { id: "p-ucwd", ring: "projects", label: "UCWD Leave Monitoring", keys: ["ucwd", "leave", "leaves", "leave monitoring"], section: "#projects",
      text: "Team project, where I was a programmer. An Android app where employees file leave applications and the office tracks and summarises them, on Firebase, with a web version." },

    // Tools
    { id: "php", ring: "tools", label: "PHP 8", keys: ["php"], section: "#stack",
      text: "Every page of Cable Manager's office system and portal, the JSON endpoints its Android app talks to, the test runner, and all four of my PHP web projects." },
    { id: "mariadb", ring: "tools", label: "MariaDB", keys: ["mariadb", "mysql", "sql", "database"], section: "#stack",
      text: "The one database behind Cable Manager's three surfaces, bundled into its installer, and the database for my PHP web projects." },
    { id: "js", ring: "tools", label: "JavaScript", keys: ["javascript", "js", "service worker"], section: "#stack",
      text: "The portal's interactive parts and its service worker, which lets it install on a phone, plus the live bidding in Auction Market." },
    { id: "kotlin", ring: "tools", label: "Kotlin", keys: ["kotlin"], section: "#stack",
      text: "Every Android app I've built: Cable Manager's subscriber app, the ITE 393 Campus App and UCWD Leave Monitoring." },
    { id: "firebase", ring: "tools", label: "Firebase", keys: ["firebase", "firestore", "realtime database"], section: "#stack",
      text: "The cloud database behind my team Android apps: Firestore for the campus app, and the Realtime Database for leave monitoring." },
    { id: "compose", ring: "tools", label: "Jetpack Compose", keys: ["compose", "jetpack", "material"], section: "#stack",
      text: "Every screen of the Android app, with Material 3." },
    { id: "apache", ring: "tools", label: "Apache", keys: ["apache", "web server"], section: "#stack",
      text: "The bundled web server. The launcher renders its configuration fresh on every start." },
    { id: "powershell", ring: "tools", label: "PowerShell", keys: ["powershell", "scripts", "script"], section: "#stack",
      text: "The launcher that starts the database, migrates, backs up and brings the web server up, plus the installer build scripts." },
    { id: "inno", ring: "tools", label: "Inno Setup", keys: ["inno"], section: "#stack",
      text: "Packages the application and its whole runtime into one setup file." },
    { id: "tailscale", ring: "tools", label: "Tailscale", keys: ["tailscale", "funnel", "vpn"], section: "#stack",
      text: "Funnel publishes the portal and app on public HTTPS without touching the router." },
    { id: "git", ring: "tools", label: "Git", keys: ["git", "github", "version control", "commits"], section: "#stack",
      text: "Every change tracked: over 120 commits on the thesis." },
  ],

  edges: [
    ["office", "php"], ["office", "mariadb"], ["office", "apache"], ["office", "installer"], ["office", "roles"],
    ["office", "restore"], ["office", "svc-business"],
    ["portal", "php"], ["portal", "js"], ["portal", "throttle"], ["portal", "svc-portal"],
    ["android-app", "kotlin"], ["android-app", "compose"], ["android-app", "offline"], ["android-app", "throttle"], ["android-app", "svc-android"],
    ["remote", "tailscale"], ["remote", "svc-setup"],
    ["restore", "mariadb"], ["restore", "svc-setup"],
    ["installer", "inno"], ["installer", "powershell"], ["installer", "svc-setup"],
    ["roles", "svc-business"], ["tests", "php"], ["tests", "git"],
    ["offline", "svc-android"], ["throttle", "roles"],
    ["p-arts", "php"], ["p-arts", "mariadb"], ["p-arts", "svc-portal"],
    ["p-auction", "php"], ["p-auction", "mariadb"], ["p-auction", "js"],
    ["p-court", "php"], ["p-court", "mariadb"], ["p-court", "svc-business"],
    ["p-pucu", "php"], ["p-pucu", "mariadb"], ["p-pucu", "js"],
    ["p-campus", "kotlin"], ["p-campus", "firebase"], ["p-campus", "svc-android"],
    ["p-ucwd", "kotlin"], ["p-ucwd", "firebase"], ["p-ucwd", "svc-android"], ["p-ucwd", "svc-business"],
    ["core", "p-arts"], ["core", "p-auction"], ["core", "p-court"], ["core", "p-pucu"], ["core", "p-campus"], ["core", "p-ucwd"],
  ],

  answers: [
    {
      keys: ["thesis", "capstone", "cable manager", "what did you build", "main project", "biggest project", "project"],
      text: "Cable Manager: billing and subscriber management for a local cable and internet provider. It comes three ways that share one database: an office system that installs as a single Windows file, a subscriber portal that installs on a phone, and a native Android app. Tailscale Funnel lets the portal and app reach it from anywhere.",
      nodes: ["office", "portal", "android-app", "remote"],
      sources: [["#work", "Case study"]],
    },
    {
      keys: ["your role", "role in", "role on", "what was your role", "what did you do", "your part", "position"],
      text: "My role on Cable Manager was full-stack developer. The case study below walks through what the system does and the problems it made me solve.",
      nodes: ["office", "portal", "android-app", "remote"],
      sources: [["#work", "Case study"]],
    },
    {
      keys: ["source code", "the code", "see the code", "see your code", "code public", "repo", "repository", "open source", "github"],
      text: "Cable Manager's code isn't public, because it was built for a real client, but I'm glad to walk you through it on a call. My GitHub accounts are github.com/nathzramirez0-sys and github.com/Nathan-281000.",
      nodes: ["git"],
      sources: [["#work", "Case study"], ["#contact", "Contact"]],
    },
    {
      keys: ["what else", "other projects", "projects", "portfolio", "built", "solo", "team", "teams", "group", "groupmates"],
      text: "Besides Cable Manager, three solo web projects: Arts & Design Showcase, Auction Market and St. Francis Court. And three team projects where I was a programmer: PUCU Event Calendar on the web, and the ITE 393 Campus App and UCWD Leave Monitoring on Android.",
      nodes: ["p-arts", "p-auction", "p-court", "p-pucu", "p-campus", "p-ucwd"],
      sources: [["#projects", "Projects"]],
    },
    {
      keys: ["stack", "tech", "technologies", "language", "languages", "framework", "frameworks", "tools"],
      text: "PHP 8 and MariaDB on the web side, Kotlin with Jetpack Compose and Firebase on Android, and PowerShell, Inno Setup and Tailscale to package and deploy. I keep dependencies low: the Android app uses Android's own HTTP and JSON classes, and the test runner needs nothing installed.",
      nodes: ["php", "mariadb", "js", "kotlin", "compose", "firebase", "apache", "powershell", "inno", "tailscale", "git"],
      sources: [["#stack", "Stack"]],
    },
    {
      keys: ["secure", "security", "secured", "safe", "password", "passwords", "hack", "hacked", "csrf", "sql injection", "attack"],
      text: "Passwords are bcrypt-hashed, and any password someone else chose must be replaced on first sign-in. Every query is a prepared statement, every form carries a CSRF token, and access is checked on the server for every page. Repeated failed sign-ins lock an account for longer each time, and every lock lands in the audit trail.",
      nodes: ["throttle", "roles"],
      sources: [["#work", "What was hard"]],
    },
    {
      keys: ["hard", "hardest", "difficult", "challenge", "challenging", "problem", "problems", "struggle", "learn", "learned", "proud"],
      text: "Two things. Making a restore that either finishes completely or changes nothing, and keeping the portal reachable from outside the office. For that one I learned the hard way that phones cache failed DNS lookups, and that a public address can lapse if the office computer is off for days.",
      nodes: ["restore", "remote"],
      sources: [["#work", "What was hard"]],
    },
    {
      keys: ["backup", "backups", "restore", "data loss", "lose data", "recover"],
      text: "Every start takes an automatic backup and keeps the thirty most recent. A restore takes a safety copy first, then refills tables inside one transaction, so it either finishes or changes nothing. It refuses a file that isn't a Cable Manager backup, is cut short, or comes from a newer version.",
      nodes: ["restore", "installer", "mariadb"],
      sources: [["#work", "What was hard"]],
    },
    {
      keys: ["test", "tests", "testing", "tested", "quality", "bugs", "reliable"],
      text: "Eleven test files, run with one command and no dependencies. Each run rebuilds a throwaway database from the schema, so tests never touch real records. They cover sign-in, access rules, billing, byte-for-byte backup round trips, and a check that every dashboard card's number matches the list it opens.",
      nodes: ["tests", "php"],
      sources: [["#work", "Case study"]],
    },
    {
      keys: ["offline", "internet goes down", "no internet", "outage", "connection", "goes down", "power"],
      text: "The office system runs on the office computer itself and needs no internet at all. Only the portal and the app need a connection to reach it, and the app keeps the last balance it saw, so subscribers aren't left with a blank screen.",
      nodes: ["office", "offline", "android-app"],
      sources: [["#work", "The brief"]],
    },
    {
      keys: ["customers use", "on their phones", "on their phone", "on a phone", "on phones", "phone", "phones", "mobile"],
      text: "Yes, two ways. The portal installs on a phone straight from the browser, like an app, and there's a native Android app with reminders, QR payment and PDF receipts.",
      nodes: ["portal", "android-app", "svc-portal", "svc-android"],
      sources: [["#work", "Case study"], ["#services", "Services"]],
    },
    {
      keys: ["business", "for my", "for me", "services", "service", "build for", "can you build", "clients", "freelance", "website", "offer"],
      text: "Business systems like billing, inventory and records; customer portals people can install on their phones; native Android apps; and the setup that keeps it all running unattended, with one-file installers and automatic backups.",
      nodes: ["svc-business", "svc-portal", "svc-android", "svc-setup"],
      sources: [["#services", "Services"], ["#contact", "Contact"]],
    },
    {
      keys: ["hire", "hiring", "available", "availability", "open to", "roles", "job", "work with", "start", "begin", "price", "cost", "rate", "quote", "email", "contact", "reach"],
      text: (email) => `I'm open to full-time roles and freelance projects. The quickest way to reach me is email: ${email}. Send a few lines about what you need and I'll reply with next steps.`,
      nodes: ["core"],
      sources: [["#contact", "Contact"], ["#about", "About"]],
    },
    {
      keys: ["docs", "documentation", "document", "manual", "guide", "paper", "defense", "defence", "methodology"],
      text: "The system ships with a user guide, a server setup guide, a features document and a tech-stack document. The README covers installing, remote access, backup and restore, security, the data model, what each role can do, and troubleshooting.",
      nodes: ["office", "tests"],
      sources: [["#work", "Case study"]],
    },
    {
      keys: ["who are you", "about you", "yourself", "your name", "background", "study", "school", "university", "student"],
      text: "I'm Jonathan Cercenina Ramirez, a Computer Science student at the University of Pangasinan – PHINMA. I build web and mobile software that keeps working when conditions aren't ideal. The About section has a little more.",
      nodes: ["core"],
      sources: [["#about", "About"]],
    },
    {
      keys: ["ai", "gpt", "chatgpt", "claude", "llm", "bot", "chatbot", "how does this work", "is this", "3d", "map"],
      text: "No language model runs here. Your question is matched to answers I wrote from this page, and the map lights up the points each answer draws on, the way an AI system retrieves its sources. It can't invent anything. The same content is in /llms.txt for AI agents that read the site.",
      nodes: [],
      sources: [["llms.txt", "/llms.txt"]],
    },
  ],

  lenses: {
    none: {
      lede: "Office systems that install on one computer and need nothing else. Portals subscribers actually use. An Android app that still shows the balance when the office is offline.",
      cta: ["#work", "Read the case study"],
      chips: ["What did you build for your thesis?", "What else have you built?", "What was the hardest part?", "How does this map work?"],
      rings: [],
    },
    recruiter: {
      lede: "Full-stack developer with a shipped thesis system: an office server, a subscriber portal and an Android app sharing one database, backed by automated tests.",
      cta: ["#about", "About me"],
      chips: ["What's your stack?", "What else have you built?", "What was the hardest part?", "Are you open to roles?"],
      rings: ["projects", "solved", "tools"],
    },
    client: {
      lede: "I build systems for small businesses without an IT department: billing, customer portals and Android apps, installed on your own computer and backed up automatically.",
      cta: ["#services", "See what I can build"],
      chips: ["What can you build for my business?", "What else have you built?", "Can customers use it on their phones?", "How do we start?"],
      rings: ["services", "projects", "work"],
    },
    faculty: {
      lede: "My thesis, Cable Manager, is billing and subscriber management for a local provider, delivered as an office system, a subscriber portal and an Android app over one database.",
      cta: ["#work", "Read the case study"],
      chips: ["What did you build for your thesis?", "What else have you built?", "How is it secured?", "How is it tested?"],
      rings: ["work", "projects", "solved"],
    },
  },
};
