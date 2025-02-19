from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class GazeData(BaseModel):
    timestamp: datetime
    x: float = Field(ge=0)
    y: float = Field(ge=0)
    confidence: float = Field(ge=0, le=1)
    pupil_size: Optional[float] = None
    screen_section: Optional[str] = None