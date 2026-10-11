from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import logging

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.core.events import event_bus, get_event_bus
from app.routers import (
    auth, farmers, farms, crops, centres, slots, bookings,
    tokens, queue, quality, weighments, procurement,
    payments, notifications, grievances, analytics, ai
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    await init_db()
    await event_bus.initialize()
    
    await seed_demo_data()
    
    yield
    
    logger.info("Shutting down...")
    await close_db()
    await event_bus.close()


app = FastAPI(
    title="Smart Agricultural Procurement Platform",
    description="Real-time coordination layer for agricultural procurement",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(farmers.router)
app.include_router(farms.router)
app.include_router(crops.router)
app.include_router(centres.router)
app.include_router(slots.router)
app.include_router(bookings.router)
app.include_router(tokens.router)
app.include_router(queue.router)
app.include_router(quality.router)
app.include_router(weighments.router)
app.include_router(procurement.router)
app.include_router(payments.router)
app.include_router(notifications.router)
app.include_router(grievances.router)
app.include_router(analytics.router)
app.include_router(ai.router)


@app.get("/")
async def root():
    return {
        "name": "Smart Agricultural Procurement Platform",
        "version": "1.0.0",
        "description": "Real-time coordination layer for agricultural procurement",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "procurement-platform"}


active_connections: dict[str, list[WebSocket]] = {}


@app.websocket("/ws/queue/{centre_id}")
async def websocket_queue(websocket: WebSocket, centre_id: str):
    await websocket.accept()
    
    if centre_id not in active_connections:
        active_connections[centre_id] = []
    active_connections[centre_id].append(websocket)
    
    try:
        queue = await event_bus.subscribe(f"queue:{centre_id}")
        while True:
            try:
                message = await asyncio.wait_for(queue.get(), timeout=30.0)
                await websocket.send_text(message)
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "ping"}))
    except WebSocketDisconnect:
        pass
    finally:
        if centre_id in active_connections:
            active_connections[centre_id].remove(websocket)
            if not active_connections[centre_id]:
                del active_connections[centre_id]


async def broadcast_queue_update(centre_id: str, data: dict):
    if centre_id in active_connections:
        message = json.dumps(data)
        for ws in active_connections[centre_id].copy():
            try:
                await ws.send_text(message)
            except Exception:
                active_connections[centre_id].remove(ws)


async def seed_demo_data():
    from app.core.database import get_session
    from app.models import Centre, Slot, Farmer, Farm, Booking
    from datetime import datetime, date, time, timedelta
    import random
    
    async for session in get_session():
        centre_count = await session.execute(select(Centre))
        if centre_count.scalars().first():
            return
        
        centres_data = [
            {
                "code": "KRN001",
                "name": "Karnal Mandi",
                "district": "Karnal",
                "state": "Haryana",
                "address": "Grain Market, Karnal, Haryana 132001",
                "latitude": 29.6857,
                "longitude": 76.9905,
                "capacity_per_slot": 25,
                "active_counters": 4,
                "status": CentreStatus.NORMAL,
            },
            {
                "code": "PNP001",
                "name": "Panipat Centre",
                "district": "Panipat",
                "state": "Haryana",
                "address": "New Grain Market, Panipat, Haryana 132103",
                "latitude": 29.3909,
                "longitude": 76.9635,
                "capacity_per_slot": 20,
                "active_counters": 3,
                "status": CentreStatus.MODERATE,
            },
            {
                "code": "KKR001",
                "name": "Kurukshetra Depot",
                "district": "Kurukshetra",
                "state": "Haryana",
                "address": "Anaj Mandi, Kurukshetra, Haryana 136118",
                "latitude": 29.9695,
                "longitude": 76.8783,
                "capacity_per_slot": 30,
                "active_counters": 5,
                "status": CentreStatus.NORMAL,
            },
            {
                "code": "AMB001",
                "name": "Ambala Hub",
                "district": "Ambala",
                "state": "Haryana",
                "address": "Grain Market, Ambala Cantt, Haryana 133001",
                "latitude": 30.3752,
                "longitude": 76.7821,
                "capacity_per_slot": 20,
                "active_counters": 3,
                "status": CentreStatus.HEAVY,
            },
        ]
        
        centres = []
        for c_data in centres_data:
            centre = Centre(**c_data)
            session.add(centre)
            centres.append(centre)
        
        await session.flush()
        
        today = date.today()
        for i, centre in enumerate(centres):
            for slot_num in range(4):
                start_hour = 9 + slot_num * 2
                slot = Slot(
                    centre_id=centre.id,
                    date=datetime.combine(today, time(start_hour, 0)),
                    start_time=f"{start_hour:02d}:00",
                    end_time=f"{start_hour+2:02d}:00",
                    max_capacity=centre.capacity_per_slot,
                    booked_count=0,
                )
                session.add(slot)
        
        for i in range(20):
            farmer = Farmer(
                mobile=f"+9198765432{i:02d}",
                name=f"Farmer {i+1}",
                aadhaar=f"{random.randint(100000000000, 999999999999)}",
                district=random.choice(["Karnal", "Panipat", "Kurukshetra", "Ambala"]),
                village=f"Village {i+1}",
                bank_account=f"ACC{random.randint(1000000000, 9999999999)}",
                ifsc_code="SBIN0001234",
                language=random.choice(["en", "hi", "pa"]),
            )
            session.add(farmer)
            await session.flush()
            
            farm = Farm(
                farmer_id=farmer.id,
                land_area_acres=random.uniform(5, 50),
                crop_code=random.choice(["WHEAT", "PADDY", "MUSTARD"]),
                variety="HD-2967",
                estimated_quantity_quintals=random.uniform(20, 100),
                season="Rabi",
            )
            session.add(farm)
            await session.flush()
            
            centre = random.choice(centres)
            slot_result = await session.execute(
                select(Slot).where(Slot.centre_id == centre.id, Slot.date >= today, Slot.is_active == True)
            )
            slots = slot_result.scalars().all()
            if slots:
                slot = random.choice(slots)
                token_number = f"TK-{today.strftime('%Y%m%d')}-{random.randint(100, 999)}"
                
                booking = Booking(
                    farmer_id=farmer.id,
                    farm_id=farm.id,
                    centre_id=centre.id,
                    slot_id=slot.id,
                    crop_code=farm.crop_code,
                    variety=farm.variety,
                    quantity_quintals=farm.estimated_quantity_quintals,
                    date=slot.date,
                    time_slot=f"{slot.start_time}-{slot.end_time}",
                    token_number=token_number,
                    status=random.choice([BookingStatus.BOOKED, BookingStatus.CONFIRMED, BookingStatus.ARRIVED]),
                    qr_code=f"data:image/png;base64,QR_{token_number}",
                    queue_position=slot.booked_count + 1,
                    estimated_wait_min=(slot.booked_count + 1) * 8 // max(centre.active_counters, 1),
                )
                session.add(booking)
                slot.booked_count += 1
        
        await session.commit()
        logger.info("Demo data seeded successfully")
        break


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)