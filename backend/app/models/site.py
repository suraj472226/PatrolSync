from sqlalchemy import Column, Integer, String, ForeignKey, Float
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    
    # Relationships
    sites = relationship("Site", back_populates="company")

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    name = Column(String(100), index=True, nullable=False)
    
    # Geofencing / Location coordinates for GPS tagging [cite: 30]
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # For QR Code generation and verification 
    qr_code_hash = Column(String(255), unique=True, nullable=True) 

    # Relationships
    company = relationship("Company", back_populates="sites")