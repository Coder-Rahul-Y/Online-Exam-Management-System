# Installation Guide for Bare Linux OS (Ubuntu/Debian)

This guide lists all the system-level software and dependencies required to set up and run the Online Exam Management System (OEMS) on a bare Linux operating system (specifically tested on Ubuntu 24.04).

---

## 1. System Updates & Essential Utilities

Ensure your package list is updated and install essential build tools, OpenSSL, and utilities needed for compilation and network requests.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential libssl-dev ca-certificates
```

---

## 2. Install Git

Used for cloning the repository and managing version control.
- **Current Version:** `2.43.0` (or latest)

```bash
sudo apt install -y git
```

---

## 3. Install Node.js & Package Managers

It is recommended to use **Node Version Manager (nvm)** to install the specific version of Node.js.

- **Current Node.js Version:** `v22.14.0` (Node 22 LTS)
- **Current npm Version:** `11.2.0`
- **Current pnpm Version:** `10.15.1`

### Step 3.1: Install NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```
*(After running the script, restart your terminal or source your profile configuration using `source ~/.bashrc` or `source ~/.profile`)*.

### Step 3.2: Install Node.js
```bash
nvm install 22.14.0
nvm use 22.14.0
```

### Step 3.3: Install Package Managers
Ensure you have the matching versions:
```bash
# Upgrade npm to 11.2.0
npm install -g npm@11.2.0

# Install pnpm 10.15.1 globally (if using pnpm)
npm install -g pnpm@10.15.1
```

---

## 4. Install PostgreSQL

The project utilizes PostgreSQL as its relational database.
- **Current PostgreSQL Version:** `17` (tested with `17.10`)

### Step 4.1: Add PostgreSQL Official Repository (Ubuntu/Debian)
```bash
# Import the repository signing key:
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update package lists and install PostgreSQL 17:
sudo apt update
sudo apt install -y postgresql-17 postgresql-client-17
```

### Step 4.2: Start and Enable PostgreSQL Service
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 4.3: Create Database & User
Switch to the `postgres` user and set up the project database:
```bash
sudo -i -u postgres psql
```
Within the PostgreSQL prompt, run the following SQL commands:
```sql
CREATE DATABASE oems_db;
CREATE USER oems_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE oems_db TO oems_user;

-- Connect to the database to grant public schema permissions (for PostgreSQL 15+):
\c oems_db
GRANT ALL ON SCHEMA public TO oems_user;
\q
```

---

## 5. Project Deployment and Setup

### Step 5.1: Clone the Repository
```bash
git clone <repository_url>
cd <repository_directory>
```

### Step 5.2: Install Project Dependencies
Run the installation command to fetch all project-specific npm packages:
```bash
# Using npm
npm install

# Or if using pnpm
pnpm install
```

### Step 5.3: Environment Configuration
Create a `.env` file in the root of the project:
```bash
cp .env.example .env
```
Update the `DATABASE_URL` in `.env` to point to your local PostgreSQL instance:
```env
DATABASE_URL="postgresql://oems_user:your_secure_password@localhost:5432/oems_db?schema=public"
```

### Step 5.4: Apply Database Migrations and Seed
Initialize the schema and populate initial mock data:
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate dev --name init

# Seed database
npx prisma db seed
```

### Step 5.5: Run the Development Server
```bash
npm run dev
# or
pnpm dev
```

---

## Concise

> **Versions:** Node.js `22.14.0` · npm `11.2.0` · PostgreSQL `17` · Git `2.43.0`

```bash
# 1. System dependencies
sudo apt update && sudo apt install -y curl git build-essential libssl-dev ca-certificates

# 2. Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22.14.0 && nvm use 22.14.0
npm install -g npm@11.2.0

# 3. PostgreSQL 17
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update && sudo apt install -y postgresql-17
sudo systemctl enable --now postgresql

# 4. Create DB & user
sudo -i -u postgres psql -c "CREATE DATABASE oems_db;"
sudo -i -u postgres psql -c "CREATE USER oems_user WITH PASSWORD 'your_secure_password';"
sudo -i -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE oems_db TO oems_user;"
sudo -i -u postgres psql -d oems_db -c "GRANT ALL ON SCHEMA public TO oems_user;"

# 5. Project setup
git clone <repository_url> && cd <repository_directory>
npm install
cp .env.example .env
# → Edit .env: set DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL

# 6. Database init & run
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

