"""
Migration script to add new columns to the checklist tables.
Run this once to update your existing database schema.
"""
import pymysql
import os

# Database connection settings
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Dbms@1234")
DB_NAME = os.getenv("DB_NAME", "patrol_db")

def run_migration():
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = conn.cursor()

        print("[*] Starting database migration...")

        # --- QUESTIONS TABLE MIGRATIONS ---
        print("\n[*] Updating 'questions' table...")

        # Add category column
        try:
            cursor.execute("ALTER TABLE questions ADD COLUMN category VARCHAR(50) NULL")
            print("  [+] Added 'category' column")
        except pymysql.err.OperationalError as e:
            if "Duplicate column" in str(e):
                print("  [=] 'category' column already exists")
            else:
                raise

        # Add company_id column
        try:
            cursor.execute("ALTER TABLE questions ADD COLUMN company_id INT NULL")
            print("  [+] Added 'company_id' column")
        except pymysql.err.OperationalError as e:
            if "Duplicate column" in str(e):
                print("  [=] 'company_id' column already exists")
            else:
                raise

        # Add options column (for Multiple Choice)
        try:
            cursor.execute("ALTER TABLE questions ADD COLUMN options TEXT NULL")
            print("  [+] Added 'options' column")
        except pymysql.err.OperationalError as e:
            if "Duplicate column" in str(e):
                print("  [=] 'options' column already exists")
            else:
                raise

        # Modify tags column to TEXT if it's VARCHAR
        try:
            cursor.execute("ALTER TABLE questions MODIFY COLUMN tags TEXT NULL")
            print("  [+] Modified 'tags' column to TEXT")
        except pymysql.err.OperationalError as e:
            print(f"  [!] Could not modify 'tags' column: {e}")

        # Add foreign key for company_id (if not exists)
        try:
            cursor.execute("""
                ALTER TABLE questions
                ADD CONSTRAINT fk_questions_company
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
            """)
            print("  [+] Added foreign key for 'company_id'")
        except pymysql.err.OperationalError as e:
            if "Duplicate" in str(e) or "already exists" in str(e).lower():
                print("  [=] Foreign key already exists")
            else:
                print(f"  [!] Could not add foreign key: {e}")

        # --- CHECKLISTS TABLE MIGRATIONS ---
        print("\n[*] Updating 'checklists' table...")

        # Add company_id column
        try:
            cursor.execute("ALTER TABLE checklists ADD COLUMN company_id INT NULL")
            print("  [+] Added 'company_id' column")
        except pymysql.err.OperationalError as e:
            if "Duplicate column" in str(e):
                print("  [=] 'company_id' column already exists")
            else:
                raise

        # Add is_active column
        try:
            cursor.execute("ALTER TABLE checklists ADD COLUMN is_active BOOLEAN DEFAULT TRUE")
            print("  [+] Added 'is_active' column")
        except pymysql.err.OperationalError as e:
            if "Duplicate column" in str(e):
                print("  [=] 'is_active' column already exists")
            else:
                raise

        # Add created_at column
        try:
            cursor.execute("ALTER TABLE checklists ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
            print("  [+] Added 'created_at' column")
        except pymysql.err.OperationalError as e:
            if "Duplicate column" in str(e):
                print("  [=] 'created_at' column already exists")
            else:
                raise

        # Add foreign key for company_id (if not exists)
        try:
            cursor.execute("""
                ALTER TABLE checklists
                ADD CONSTRAINT fk_checklists_company
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
            """)
            print("  [+] Added foreign key for 'company_id'")
        except pymysql.err.OperationalError as e:
            if "Duplicate" in str(e) or "already exists" in str(e).lower():
                print("  [=] Foreign key already exists")
            else:
                print(f"  [!] Could not add foreign key: {e}")

        conn.commit()
        conn.close()

        print("\n[SUCCESS] Migration completed successfully!")
        print("You can now restart your backend server.")

    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        raise

if __name__ == "__main__":
    run_migration()
