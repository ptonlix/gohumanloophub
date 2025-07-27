import psycopg
conn = psycopg.connect(
    host="localhost",
    dbname="app",
    user="postgres",
    password="test123456",
    options="-c password_encryption=scram-sha-256"
)

print(conn)
