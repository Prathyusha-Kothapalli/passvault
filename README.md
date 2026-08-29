# PassVault — Security Password Manager & Digital Vault

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](#)
[![Node.js](https://img.shields.io/badge/Node.js-v22.x-green.svg)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-cyan.svg)](https://docker.com)

**PassVault** is a production-quality, enterprise-grade Security Password Manager & Digital Vault built with JavaScript (ES6+), HTML5, CSS3, Node.js/Express, SQLite, and Python 3.10+. It implements zero-knowledge AES-256-GCM client/server encryption, real-time password strength evaluation, inactivity auto-locking, backup JSON export/import, audit logging, and standalone Python security CLI utilities.

---

## 🌟 Key Features

- 🔐 **Zero-Knowledge AES-256 Encryption**: Client-side (Web Crypto API) and server-side (Node `crypto`) AES-256-GCM encryption derived via PBKDF2 with 100,000 iterations.
- 🛡️ **User Authentication**: Secure register/login with bcrypt password hashing (12 salt rounds), rate limiting, and JWT session tokens.
- 🔑 **Encrypted Password Vault**: Full CRUD operations with categories (Work, Personal, Finance, Social, Entertainment), tags, favorite star toggles, and copy-with-visibility toggles.
- 🎲 **Interactive Password Generator**: Cryptographically strong password generation with customizable length (6–64 chars), character set options, pronounceable/readable filtering, and entropy score indicators.
- 📊 **Password Strength Analyzer**: Real-time zxcvbn-style entropy calculator, character composition analysis, time-to-crack estimation, and weak/duplicate detection across all vault entries.
- 📈 **Security Health Dashboard**: SVG circular security score gauge (0–100%), vault posture breakdown, visual status cards, and one-click security recommendation fixes.
- 📝 **Encrypted Secure Notes**: Digital notepad supporting encrypted content, tags, and favorites.
- ⏱️ **Inactivity Auto-Lock**: Idle timer monitor that blurs the application screen and prompts for master password re-authentication after a configurable timeout (default 5 minutes).
- 📋 **Secure Clipboard Wipe**: Copies passwords safely to system clipboard with an automatic 30-second wipe timer and toast notification.
- 💾 **JSON Backup & Restore**: Full JSON export and restore wizard with master passphrase encryption validation.
- 📜 **Audit Log & Activity Trail**: Immutable timestamped log tracking user authentication attempts, vault item access, and security settings modifications.
- 🎨 **Responsive Dark/Light UI/UX**: Enterprise glassmorphism visual system built with modern CSS custom variables, typography, and micro-animations.
- 🐍 **Python 3.10 Security Toolkit**: Command-line audit scanner (`vault_audit.py`), entropy calculator (`entropy_scanner.py`), and standalone backup file encryptor (`backup_encryptor.py`).

---

## ⚡ Demo Account & Auto-Seeding

On server startup, PassVault automatically initializes the database schema and creates the demo user and 5 encrypted seed entries with realistic non-plain-text passwords:

- **Email**: `demo@passvault.com`
- **Master Password**: `Demo@123`

### Encrypted Seed Entries:
1. **Gmail** — `alex.johnson@gmail.com` *(Personal)*
2. **GitHub** — `alexdev` *(Work)*
3. **HDFC Bank** — `alex.johnson` *(Finance)*
4. **Netflix** — `alex@netflix.com` *(Entertainment)*
5. **LinkedIn** — `alex.johnson@linkedin.com` *(Social)*

---

## 📁 Repository Structure

```
passvault/
├── Makefile                          # Workflow & automation task commands
├── Dockerfile                        # Multi-stage production container configuration
├── docker-compose.yml                # Container orchestration specification
├── .dockerignore                     # Docker build ignore rules
├── package.json                      # Node.js dependencies & test scripts
├── server/                           # Node.js / Express REST API
│   ├── index.js                      # Application entry point
│   ├── config/database.js            # SQLite database connection & migrations
│   ├── middleware/                   # JWT Auth, rate limiting & error handler
│   ├── controllers/                  # Route handlers (auth, vault, notes, audit, backup, settings)
│   ├── services/                     # AES-256 crypto, seed & audit services
│   └── routes/                       # Express router definitions
├── client/                           # Frontend Single Page App (SPA)
│   ├── index.html                    # Semantic HTML layout
│   ├── css/                          # CSS design system (main, theme, components, dashboard, vault, generator)
│   └── js/                           # JavaScript ES6+ modules
│       ├── crypto.js                 # Web Crypto API wrapper (AES-GCM-256, PBKDF2)
│       ├── api.js                    # Fetch REST client
│       ├── auth.js                   # Client auth state
│       ├── components/               # Navbar, modal, toast, chart, autolock
│       ├── views/                    # Dashboard, Vault, Generator, Analyzer, Notes, Audit, Backup, Settings
│       └── utils/                    # PasswordUtils & Clipboard
├── py_security_tools/                # Python 3.10 Security CLI Tools
│   ├── vault_audit.py                # Database health auditor
│   ├── entropy_scanner.py            # Entropy & pattern analysis CLI
│   └── backup_encryptor.py           # Standalone JSON backup encryptor
└── tests/                            # Automated Test Suites
    ├── auth.test.js                  # Authentication tests
    ├── crypto.test.js                # AES-256-GCM encryption tests
    ├── vault.test.js                 # Database & vault CRUD tests
    ├── generator.test.js             # Generator & entropy tests
    └── python_tools.test.py          # Python unittest suite
```

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0+ or v22.x
- **Python**: v3.10+
- **Docker** *(Optional)*

### 1. Clone & Install
```bash
# Install Node.js dependencies
npm install
```

### 2. Run Development Server
```bash
# Start PassVault Server on http://localhost:3000
npm start
```

Open your browser and navigate to `http://localhost:3000`. Log in using the Demo Account button or register a new user!

---

## 🧪 Testing Suite

PassVault includes 5 automated test files verifying backend endpoints, encryption integrity, database operations, password generators, and Python security tools.

### Run JavaScript Tests:
```bash
npm test
# OR
node --test tests/*.test.js
```

### Run Python Tests:
```bash
python -m unittest discover -s tests -p "*.py"
```

---

## 🐍 Python 3.10 Security Toolkit

### 1. Database Security Auditor
```bash
python py_security_tools/vault_audit.py
```

### 2. Password Entropy Scanner CLI
```bash
python py_security_tools/entropy_scanner.py "P@ssv4ult_Secure_2026!"
```

### 3. Backup Encryptor CLI
```bash
# Encrypt backup file
python py_security_tools/backup_encryptor.py encrypt --file backup.json --out backup.enc.json --password "MySecretKey"

# Decrypt backup file
python py_security_tools/backup_encryptor.py decrypt --file backup.enc.json --out backup.dec.json --password "MySecretKey"
```

---

## 🐳 Docker Deployment

### Run with Docker Compose:
```bash
docker-compose up -d
```
Access PassVault at `http://localhost:3000`.

---

## 🛠️ Makefile Commands

```bash
make install       # Install dependencies
make dev           # Start development server
make test          # Run all JS and Python test suites
make py-audit      # Run Python database audit
make docker-build  # Build Docker container image
make docker-run    # Run Docker compose services
```

---

## 🔀 5-Phase Development Workflow

The development of PassVault was structured into 5 feature phases suitable for Git commits and Pull Requests:

- **Phase 1: Foundation, Core Architecture & Authentication Engine**
  - Setup Node.js Express backend, SQLite database schema, bcrypt hashing, JWT authentication, rate limiting, and glassmorphism auth UI. Auto-seeded demo account (`demo@passvault.com` / `Demo@123`).
- **Phase 2: Encrypted Vault Management, Categories & Secure Notes**
  - Client & server-side Web Crypto AES-256-GCM zero-knowledge encryption services, password CRUD operations, category chips, tags, and secure notes.
- **Phase 3: Password Generator, Strength Analyzer & Security Dashboard**
  - Customizable password generator, entropy calculator, time-to-crack estimator, and visual security health dashboard with circular score gauge (0-100%).
- **Phase 4: Security Hardening (Auto-Lock, Audit Logging, Backup & Settings)**
  - Inactivity session auto-lock overlay, timestamped audit trail engine, JSON backup export/import wizard, dark/light theme engine, and clipboard auto-clear (30s).
- **Phase 5: Python 3.10 Security Toolkit, Testing Suite, Dockerization & Production Packaging**
  - CLI tools (`vault_audit.py`, `entropy_scanner.py`, `backup_encryptor.py`), 5 automated test files, Docker containerization, Makefile automation, and documentation.

---

## 📄 License

This software is Proprietary and Confidential. All Rights Reserved.
