from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict


class TechniqueBase(BaseModel):
    name: str
    slug: str
    category: str
    description: str
    instructions: str
    default_configuration: Dict[str, Any]
    is_active: bool = True


class TechniqueOut(TechniqueBase):
    id: str
    is_favourite: bool = False

    model_config = ConfigDict(from_attributes=True)


class TechniqueDetailOut(TechniqueOut):
    pass
