from app.database.connection import SessionLocal
from app.models.user import User, UserRole
from app.models.site import Company, Site

def seed_database():
    db = SessionLocal()
    try:
        # Check if database is already seeded
        if db.query(User).first():
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding database...")

        # 1. Create a Company
        company = Company(name="Apex Security Solutions")
        db.add(company)
        db.commit()
        db.refresh(company)

        # 2. Create Sites (Using general coordinates)
        site1 = Site(
            company_id=company.id, 
            name="Main Tech Park", 
            latitude=18.5204, 
            longitude=73.8567
        )
        site2 = Site(
            company_id=company.id, 
            name="Downtown Office", 
            latitude=18.5247, 
            longitude=73.8629
        )
        db.add_all([site1, site2])
        db.commit()

        # 3. Create an Admin User
        admin_user = User(
            employee_id="ADM001",
            mobile_number="9999999999",
            hashed_password="dummy_hash", # We are using OTP '123456' in our auth_service right now
            role=UserRole.ADMIN
        )

        # 4. Create a Field Officer
        field_officer = User(
            employee_id="EMP100",
            mobile_number="8888888888",
            hashed_password="dummy_hash",
            role=UserRole.FIELD_OFFICER
        )

        db.add_all([admin_user, field_officer])
        db.commit()

        print("✅ Mock data injected successfully!")
        print("-" * 30)
        print("Use these credentials to test the API:")
        print("Field Officer -> Identifier: EMP100  | OTP: 123456")
        print("Admin User    -> Identifier: ADM001  | OTP: 123456")
        print("-" * 30)
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()