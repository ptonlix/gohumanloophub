#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python app/backend_pre_start.py

# Check MongoDB connection
python app/mongodb_pre_start.py

# Check Redis connection
python app/redis_pre_start.py

# Run migrations
alembic upgrade head

# Create initial data in DB
python app/initial_data.py
