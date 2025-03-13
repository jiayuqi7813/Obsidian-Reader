#!/bin/bash

# Knowledge Base Docker deployment script

# Default values
DEFAULT_PASSWORD="123456"
DEFAULT_DATA_PATH="./data"
DEFAULT_PORT="3000"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --password) PASSWORD="$2"; shift ;;
        --data-path) DATA_PATH="$2"; shift ;;
        --port) PORT="$2"; shift ;;
        --help) SHOW_HELP=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Show help
if [ "$SHOW_HELP" = true ]; then
    echo "Knowledge Base Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [options]"
    echo ""
    echo "Options:"
    echo "  --password PASSWORD   Set the password for the knowledge base (default: $DEFAULT_PASSWORD)"
    echo "  --data-path PATH      Set the path to your knowledge base files (default: $DEFAULT_DATA_PATH)"
    echo "  --port PORT           Set the port to expose the application (default: $DEFAULT_PORT)"
    echo "  --help                Show this help message"
    exit 0
fi

# Set default values if not provided
PASSWORD=${PASSWORD:-$DEFAULT_PASSWORD}
DATA_PATH=${DATA_PATH:-$DEFAULT_DATA_PATH}
PORT=${PORT:-$DEFAULT_PORT}

# Create .env file
echo "Creating .env file..."
cat > .env << EOF
KB_PASSWORD=$PASSWORD
KB_DATA_PATH=$DATA_PATH
EOF

# Ensure data directory exists
mkdir -p "$DATA_PATH"

# Start the application
echo "Starting Knowledge Base with Docker Compose..."
export KB_PASSWORD="$PASSWORD"
export KB_DATA_PATH="$DATA_PATH"

# Update the port in docker-compose.yml if needed
if [ "$PORT" != "$DEFAULT_PORT" ]; then
    echo "Setting custom port: $PORT..."
    sed -i.bak "s/- \"$DEFAULT_PORT:$DEFAULT_PORT\"/- \"$PORT:$DEFAULT_PORT\"/" docker-compose.yml
    rm docker-compose.yml.bak 2>/dev/null || true
fi

# Start the containers
docker-compose up -d

echo ""
echo "Knowledge Base is now running!"
echo "Access it at: http://localhost:$PORT"
echo "- Username: admin"
echo "- Password: $PASSWORD"
echo "- Knowledge Base files are stored in: $DATA_PATH"
echo ""
echo "To stop the application, run: docker-compose down"

