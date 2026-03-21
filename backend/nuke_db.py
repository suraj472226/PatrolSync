import pymysql

# Update these if your MySQL password or database name is different!
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "Dbms@1234" # Put your MySQL password here if you have one
DB_NAME = "patrol_db" # Put your exact database name here

try:
    # Connect to MySQL *without* specifying the database
    conn = pymysql.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD)
    cursor = conn.cursor()
    
    # Forcefully drop the entire database if it exists
    cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
    print(f"💥 Successfully destroyed '{DB_NAME}'")
    
    # Recreate it perfectly clean
    cursor.execute(f"CREATE DATABASE {DB_NAME}")
    print(f"✨ Successfully created a clean '{DB_NAME}'")
    
    conn.commit()
    conn.close()
except Exception as e:
    print(f"Error: {e}")