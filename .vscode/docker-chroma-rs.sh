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

# Stop the containers
print_message "Stopping containers..."
if [ "$ENV" = "dev" ]; then
    docker-compose -f docker-compose.dev.yml down
else
    docker-compose -f docker-compose.yml down
fi

# Remove the volume
print_message "Removing ChromaDB volume..."
docker volume rm $VOLUME_NAME

# Start the containers again
print_message "Starting containers..."
if [ "$ENV" = "dev" ]; then
    docker-compose -f docker-compose.dev.yml up -d
else
    docker-compose -f docker-compose.yml up -d
fi

# Wait for ChromaDB to be ready
print_message "Waiting for ChromaDB to be ready..."
sleep 5

print_success "ChromaDB has been reset successfully!"
print_message "The database is now empty and ready to use."