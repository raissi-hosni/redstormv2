#!/bin/bash
# setup-venv.sh - Simple RedStorm Virtual Environment Setup

set -e

# Create virtual environment
python3 -m venv redstorm-env

# Activate virtual environment
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    source redstorm-env/bin/activate
else
    # Linux/Mac
    source redstorm-env/bin/activate
fi

# Install requirements
pip install -r requirements.txt
cd tools
# Build the tool
go build -o redstorm-tools .
mv redstorm-tools ../agents
cd ..

echo "Virtual environment setup complete!"
echo "To activate: source redstorm-env/bin/activate"