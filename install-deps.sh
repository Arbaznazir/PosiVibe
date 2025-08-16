#!/bin/bash
set -e

echo "Installing root dependencies..."
npm install

echo "Installing API dependencies..."
cd api
npm install

echo "All dependencies installed successfully!"
