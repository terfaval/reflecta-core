from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .metadata_fallback import get_profile_metadata

router = APIRouter()

class ProfileMetadataRequest(BaseModel):
    profile: str

@router.post('/profile/metadata')
async def profile_metadata(payload: ProfileMetadataRequest):
    if not payload.profile:
        raise HTTPException(status_code=400, detail='Missing profile')
    try:
        data = get_profile_metadata(payload.profile)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    if not data:
        raise HTTPException(status_code=404, detail='Not found')
    return data