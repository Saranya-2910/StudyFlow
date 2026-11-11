# Multi-stage or slim Python 3.12 base
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for building PostgreSQL drivers if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Set default environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

EXPOSE 8000

# Start FastAPI application
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
