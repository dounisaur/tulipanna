#!/bin/bash

# Function to print colored output
print_message() {
    echo -e "\033[1;34m$1\033[0m"
}

print_error() {
    echo -e "\033[1;31m$1\033[0m"
}

print_success() {
    echo -e "\033[1;32m$1\033[0m"
}

# Check if environment argument is provided
if [ -z "$1" ]; then
    print_error "Please specify environment (dev/prod)"
    echo "Usage: ./reset-chroma.sh [dev|prod]"
    exit 1
fi

ENV=$1

# Validate environment
if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    print_error "Invalid environment. Use 'dev' or 'prod'"
    exit 1
fi

# Set volume name based on environment
VOLUME_NAME="chroma_data_${ENV}"

print_message "Starting ChromaDB reset process for $ENV environment..."

# Stop the containers and remove volumes
print_message "Stopping containers and removing volumes..."
if [ "$ENV" = "dev" ]; then
    docker-compose -f docker-compose.dev.yml down -v
else
    docker-compose -f docker-compose.yml down -v
fi

# Ensure the volume is removed
print_message "Ensuring ChromaDB volume is removed..."
docker volume rm $VOLUME_NAME 2>/dev/null || true

# Start the containers
print_message "Starting containers..."
if [ "$ENV" = "dev" ]; then
    docker-compose -f docker-compose.dev.yml up -d
else
    docker-compose -f docker-compose.yml up -d
fi

# Wait for ChromaDB to be ready
print_message "Waiting for ChromaDB to be ready..."
sleep 5

# Verify ChromaDB is empty
print_message "Verifying ChromaDB is empty..."
if [ "$ENV" = "dev" ]; then
    CONTAINER_NAME="chromadb-dev"
else
    CONTAINER_NAME="chromadb-prod"
fi

# Check if the database is empty by verifying its size
DB_SIZE=$(docker exec $CONTAINER_NAME sh -c 'ls -l /data/chroma.sqlite3 | awk "{print \$5}"')
if [ "$DB_SIZE" -lt 200000 ]; then  # Empty ChromaDB is typically around 163KB
    print_success "ChromaDB has been reset successfully!"
    print_message "The database is now empty and ready to use."
else
    print_error "ChromaDB reset may have failed. Database size is $DB_SIZE bytes."
    exit 1
fi