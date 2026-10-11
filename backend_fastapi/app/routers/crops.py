from fastapi import APIRouter, Depends, Query
from typing import List, Optional

from app.core.config import CROPS, get_quality_norms, get_crop_info
from app.schemas import CropInfo

router = APIRouter(prefix="/crops", tags=["Crops"])


@router.get("/", response_model=List[CropInfo])
async def list_crops(lang: str = Query("en", pattern="^(en|hi|pa)$")):
    return [
        CropInfo(
            code=crop["code"],
            name=crop.get(f"name_{lang}", crop["name_en"]),
            msp_per_quintal=crop["msp_per_quintal"],
            icon=crop["icon"],
        )
        for crop in CROPS
    ]


@router.get("/{crop_code}", response_model=CropInfo)
async def get_crop(crop_code: str, lang: str = Query("en", pattern="^(en|hi|pa)$")):
    crop_info = get_crop_info(crop_code, lang)
    if crop_info["name"] == crop_code:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Crop not found")
    return CropInfo(**crop_info)


@router.get("/{crop_code}/quality-norms")
async def get_crop_quality_norms(crop_code: str):
    norms = get_quality_norms(crop_code)
    return {"crop_code": crop_code, "norms": norms}