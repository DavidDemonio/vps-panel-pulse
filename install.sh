
#!/bin/bash

# ProxVPS Setup Script
echo "╔══════════════════════════════════════════════╗"
echo "║          ProxVPS Installation Script         ║"
echo "╚══════════════════════════════════════════════╝"
echo

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Default configuration values
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="proxvps"
DB_USER="proxvps"
DB_PASS=$(openssl rand -base64 12)
ADMIN_EMAIL="davidtorreslopez190924@gmail.com"
ADMIN_PASSWORD="djfainali"
PROXMOX_HOST="localhost"
PROXMOX_PORT="8006"
PROXMOX_USER="root@pam"
PROXMOX_PASSWORD=""
PAYPAL_CLIENT_ID="test"
PAYPAL_SECRET="test"
API_PORT="3000"

# Ask for configuration values
read -p "Database Host [$DB_HOST]: " input
DB_HOST=${input:-$DB_HOST}

read -p "Database Port [$DB_PORT]: " input
DB_PORT=${input:-$DB_PORT}

read -p "Database Name [$DB_NAME]: " input
DB_NAME=${input:-$DB_NAME}

read -p "Database User [$DB_USER]: " input
DB_USER=${input:-$DB_USER}

read -p "Database Password [$DB_PASS]: " input
DB_PASS=${input:-$DB_PASS}

read -p "Admin Email [$ADMIN_EMAIL]: " input
ADMIN_EMAIL=${input:-$ADMIN_EMAIL}

read -p "Admin Password [$ADMIN_PASSWORD]: " input
ADMIN_PASSWORD=${input:-$ADMIN_PASSWORD}

read -p "Proxmox Host [$PROXMOX_HOST]: " input
PROXMOX_HOST=${input:-$PROXMOX_HOST}

read -p "Proxmox Port [$PROXMOX_PORT]: " input
PROXMOX_PORT=${input:-$PROXMOX_PORT}

read -p "Proxmox User [$PROXMOX_USER]: " input
PROXMOX_USER=${input:-$PROXMOX_USER}

read -p "Proxmox Password: " PROXMOX_PASSWORD

read -p "PayPal Client ID [$PAYPAL_CLIENT_ID]: " input
PAYPAL_CLIENT_ID=${input:-$PAYPAL_CLIENT_ID}

read -p "PayPal Secret [$PAYPAL_SECRET]: " input
PAYPAL_SECRET=${input:-$PAYPAL_SECRET}

read -p "API Port [$API_PORT]: " input
API_PORT=${input:-$API_PORT}

echo
echo "Creating configuration file..."

# Create config directory if it doesn't exist
mkdir -p ./config

# Create configuration file
cat > ./config/config.env <<EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS

# Admin User
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Proxmox API
PROXMOX_HOST=$PROXMOX_HOST
PROXMOX_PORT=$PROXMOX_PORT
PROXMOX_USER=$PROXMOX_USER
PROXMOX_PASSWORD=$PROXMOX_PASSWORD
PROXMOX_API_TOKEN_NAME=""
PROXMOX_API_TOKEN_VALUE=""

# PayPal Integration
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=$PAYPAL_CLIENT_ID
PAYPAL_SECRET=$PAYPAL_SECRET

# API Configuration
API_PORT=$API_PORT
API_SECRET=$(openssl rand -base64 32)
API_TOKEN_EXPIRY=86400
EOF

echo "Configuration file created at ./config/config.env"

# Check for dependencies
echo
echo "Checking dependencies..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Would you like to install it? (y/n)"
    read -r install_node
    if [[ $install_node =~ ^[Yy]$ ]]; then
        echo "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt install -y nodejs
    else
        echo "Please install Node.js manually and rerun this script."
        exit 1
    fi
fi

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Would you like to install it? (y/n)"
    read -r install_postgres
    if [[ $install_postgres =~ ^[Yy]$ ]]; then
        echo "Installing PostgreSQL..."
        apt install -y postgresql postgresql-contrib
    else
        echo "Please install PostgreSQL manually and rerun this script."
        exit 1
    fi
fi

# Create database and user if using localhost
if [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ]; then
    echo
    echo "Setting up local PostgreSQL database..."
    
    # Start PostgreSQL if not running
    if ! systemctl is-active --quiet postgresql; then
        systemctl start postgresql
    fi
    
    # Create database and user
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    
    echo "Database created successfully."
fi

# Initialize database tables
echo
echo "Would you like to initialize the database schema? (y/n)"
read -r init_db
if [[ $init_db =~ ^[Yy]$ ]]; then
    echo "Creating database schema..."
    
    # Create schema SQL file
    cat > ./config/schema.sql <<EOF
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 8006,
    status VARCHAR(50) DEFAULT 'offline',
    cpu_total INTEGER DEFAULT 0,
    cpu_used INTEGER DEFAULT 0,
    memory_total INTEGER DEFAULT 0,
    memory_used INTEGER DEFAULT 0,
    storage_total INTEGER DEFAULT 0,
    storage_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OS Templates table
CREATE TABLE IF NOT EXISTS os_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cpu INTEGER NOT NULL,
    memory INTEGER NOT NULL,
    storage INTEGER NOT NULL,
    bandwidth INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servers table
CREATE TABLE IF NOT EXISTS servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    vmid INTEGER,
    node VARCHAR(255) NOT NULL,
    cpu INTEGER NOT NULL,
    memory INTEGER NOT NULL,
    storage INTEGER NOT NULL,
    ip_address VARCHAR(255),
    os_template VARCHAR(255) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    plan_id INTEGER REFERENCES plans(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Server Usage table
CREATE TABLE IF NOT EXISTS server_usage (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES servers(id),
    cpu DECIMAL(5, 2),
    memory DECIMAL(5, 2),
    disk DECIMAL(5, 2),
    network_in DECIMAL(10, 2),
    network_out DECIMAL(10, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    paid_at TIMESTAMP
);

-- Invoice Items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id),
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    gateway VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin user
INSERT INTO users (name, email, password, role)
VALUES ('Admin', '$ADMIN_EMAIL', '$ADMIN_PASSWORD', 'admin');

-- Add sample nodes
INSERT INTO nodes (name, address, port, status, cpu_total, cpu_used, memory_total, memory_used, storage_total, storage_used)
VALUES 
('Node 1', 'node1.example.com', 8006, 'online', 32, 8, 128, 48, 2000, 500),
('Node 2', 'node2.example.com', 8006, 'online', 64, 24, 256, 96, 4000, 1200);

-- Add sample OS templates
INSERT INTO os_templates (name, description, file)
VALUES 
('Ubuntu 22.04', 'Ubuntu 22.04 LTS (Jammy Jellyfish)', 'local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst'),
('Debian 11', 'Debian 11 (Bullseye)', 'local:vztmpl/debian-11-standard_11.3-1_amd64.tar.zst'),
('CentOS 9 Stream', 'CentOS 9 Stream', 'local:vztmpl/centos-9-stream-default_20221130_amd64.tar.xz'),
('Alpine 3.17', 'Alpine Linux 3.17', 'local:vztmpl/alpine-3.17-default_20221129_amd64.tar.xz');

-- Add sample plans
INSERT INTO plans (name, cpu, memory, storage, bandwidth, price)
VALUES 
('Basic', 1, 2, 20, 1000, 5.99),
('Standard', 2, 4, 50, 2000, 12.99),
('Professional', 4, 8, 100, 4000, 24.99),
('Enterprise', 8, 16, 200, 8000, 49.99);

-- Add sample servers
INSERT INTO servers (name, status, vmid, node, cpu, memory, storage, ip_address, os_template, user_id, plan_id)
VALUES 
('web-server-1', 'running', 101, 'Node 1', 2, 4, 50, '192.168.1.101', 'Ubuntu 22.04', 1, 2),
('db-server-1', 'running', 102, 'Node 1', 4, 8, 100, '192.168.1.102', 'Debian 11', 1, 3),
('test-server', 'stopped', 103, 'Node 2', 1, 2, 20, '192.168.1.103', 'Alpine 3.17', 1, 1);

-- Add sample invoices
INSERT INTO invoices (user_id, amount, status, due_date)
VALUES 
(1, 12.99, 'paid', CURRENT_TIMESTAMP + INTERVAL '30 days'),
(1, 24.99, 'pending', CURRENT_TIMESTAMP + INTERVAL '30 days');

-- Add sample invoice items
INSERT INTO invoice_items (invoice_id, description, amount, quantity)
VALUES 
(1, 'Standard Plan - Monthly', 12.99, 1),
(2, 'Professional Plan - Monthly', 24.99, 1);

-- Add sample transactions
INSERT INTO transactions (user_id, amount, type, status, gateway, gateway_transaction_id)
VALUES 
(1, 12.99, 'payment', 'completed', 'paypal', 'PAYPAL-TXN-123456'),
(1, 50.00, 'payment', 'completed', 'paypal', 'PAYPAL-TXN-789012');
EOF

    # Execute the SQL commands
    if [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ]; then
        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f ./config/schema.sql
        echo "Database schema created successfully."
    else
        echo "Please run the schema script manually:"
        echo "PGPASSWORD=\"$DB_PASS\" psql -h \"$DB_HOST\" -p \"$DB_PORT\" -U \"$DB_USER\" -d \"$DB_NAME\" -f ./config/schema.sql"
    fi
fi

echo
echo "Installation completed successfully!"
echo
echo "To start the application:"
echo "1. Install dependencies: npm install"
echo "2. Build the frontend: npm run build"
echo "3. Start the server: npm start"
echo
echo "Thank you for installing ProxVPS!"
