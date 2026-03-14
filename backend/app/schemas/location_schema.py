from pydantic import BaseModel
from typing import List, Optional

class SiteResponse(BaseModel):
    id: int
    company_id: int
    name: str
    latitude: Optional[float]
    longitude: Optional[float]
    qr_code_hash: Optional[str]

    class Config:
        from_attributes = True

class CompanyResponse(BaseModel):
    id: int
    name: str
    sites: List[SiteResponse] = []

    class Config:
        from_attributes = True