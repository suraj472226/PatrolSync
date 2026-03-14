from app.database.connection import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.site import Company, Site
from app.models.patrol import Shift, PatrolLog, ScanType
from app.models.incident import Incident
from datetime import datetime, timedelta
import random

def seed_rich_data():
    # 1. Drop and recreate all tables for a completely fresh start
    print("Resetting database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Injecting rich mock data for today's dashboard...")
        now = datetime.utcnow()

        # --- COMPANIES & SITES ---
        company = Company(name="Apex Security Solutions")
        db.add(company)
        db.commit()
        db.refresh(company)

        # Let's add 3 sites around Pune
        sites = [
            Site(company_id=company.id, name="Main Tech Park", latitude=18.5204, longitude=73.8567),
            Site(company_id=company.id, name="Downtown Office", latitude=18.5247, longitude=73.8629),
            Site(company_id=company.id, name="Industrial Warehouse", latitude=18.5362, longitude=73.8938)
        ]
        db.add_all(sites)
        db.commit()
        for s in sites: db.refresh(s)

        # --- USERS ---
        users = [
            User(employee_id="ADM001", mobile_number="9999999999", hashed_password="hash", role=UserRole.ADMIN),
            User(employee_id="EMP101", mobile_number="8888888881", hashed_password="hash", role=UserRole.FIELD_OFFICER),
            User(employee_id="EMP102", mobile_number="8888888882", hashed_password="hash", role=UserRole.FIELD_OFFICER),
            User(employee_id="EMP103", mobile_number="8888888883", hashed_password="hash", role=UserRole.FIELD_OFFICER)
        ]
        db.add_all(users)
        db.commit()
        for u in users: db.refresh(u)

        # --- ACTIVE SHIFTS (For the Live Map) ---
        # We will make EMP101 and EMP102 currently on duty
        shifts = [
            Shift(user_id=users[1].id, start_time=now - timedelta(hours=2), start_latitude=18.5204, start_longitude=73.8567),
            Shift(user_id=users[2].id, start_time=now - timedelta(hours=1), start_latitude=18.5247, start_longitude=73.8629)
        ]
        db.add_all(shifts)
        db.commit()
        for sh in shifts: db.refresh(sh)

        # --- PATROL LOGS (For "Sites Patrolled" stat) ---
        logs = [
            PatrolLog(shift_id=shifts[0].id, site_id=sites[0].id, scan_time=now - timedelta(minutes=90), scan_type=ScanType.QR_CODE),
            PatrolLog(shift_id=shifts[0].id, site_id=sites[0].id, scan_time=now - timedelta(minutes=30), scan_type=ScanType.GPS),
            PatrolLog(shift_id=shifts[1].id, site_id=sites[1].id, scan_time=now - timedelta(minutes=45), scan_type=ScanType.QR_CODE)
        ]
        db.add_all(logs)

        # --- INCIDENTS (For "Critical Incidents" and Reports Table) ---
        incidents = [
            Incident(
                user_id=users[1].id, site_id=sites[0].id, category="Maintenance", 
                remarks="Broken window near the south gate.", reported_at=now - timedelta(hours=1),
                latitude=18.5205, longitude=73.8568
            ),
            Incident(
                user_id=users[2].id, site_id=sites[1].id, category="EMERGENCY_SOS", 
                remarks="Suspicious activity in the parking lot! Requesting backup.", reported_at=now - timedelta(minutes=15),
                latitude=18.5248, longitude=73.8630
            ),
            Incident(
                user_id=users[1].id, site_id=sites[0].id, category="Security", 
                remarks="Unauthorized vehicle parked in reserved spot.", reported_at=now - timedelta(minutes=5),
                latitude=18.5202, longitude=73.8565
            )
        ]
        db.add_all(incidents)
        db.commit()

        print("✅ Success! Database populated with rich test data.")
        print("Login with Employee ID: ADM001 | OTP: 123456")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_rich_data()