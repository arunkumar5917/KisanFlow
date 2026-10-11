import asyncio
import random
from datetime import datetime, date, time, timedelta
from sqlalchemy import select

from app.core.database import init_db, get_session
from app.models import (
    Centre, Slot, Farmer, Farm, Booking,
    CentreStatus, BookingStatus
)


async def seed():
    await init_db()
    
    async for session in get_session():
        centre_count = await session.execute(select(Centre))
        if centre_count.scalars().first():
            print("Database already seeded")
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
        tomorrow = today + timedelta(days=1)
        
        for centre in centres:
            for day in [today, tomorrow]:
                for slot_num in range(4):
                    start_hour = 9 + slot_num * 2
                    slot = Slot(
                        centre_id=centre.id,
                        date=datetime.combine(day, time(start_hour, 0)),
                        start_time=f"{start_hour:02d}:00",
                        end_time=f"{start_hour+2:02d}:00",
                        max_capacity=centre.capacity_per_slot,
                        booked_count=0,
                    )
                    session.add(slot)
        
        await session.flush()
        
        farmer_names = [
            "Harpreet Singh", "Gurmeet Kaur", "Baljinder Singh", "Rajinder Kaur",
            "Sukhdev Singh", "Paramjit Kaur", "Jaswinder Singh", "Manpreet Kaur",
            "Gurpreet Singh", "Kulwinder Kaur", "Davinder Singh", "Satinder Kaur",
            "Harvinder Singh", "Jasbir Kaur", "Kuldeep Singh", "Ravinder Kaur",
            "Surinder Singh", "Amrit Kaur", "Tejinder Singh", "Kamaljeet Kaur",
        ]
        
        for i in range(20):
            farmer = Farmer(
                mobile=f"+9198765432{i:02d}",
                name=farmer_names[i],
                aadhaar=f"{random.randint(100000000000, 999999999999)}",
                district=random.choice(["Karnal", "Panipat", "Kurukshetra", "Ambala"]),
                village=f"Village {i+1}",
                bank_account=f"ACC{random.randint(1000000000, 9999999999)}",
                ifsc_code="SBIN0001234",
                language=random.choice(["en", "hi", "pa"]),
            )
            session.add(farmer)
            await session.flush()
            
            crop_code = random.choice(["WHEAT", "PADDY", "MUSTARD"])
            farm = Farm(
                farmer_id=farmer.id,
                land_area_acres=round(random.uniform(5, 50), 1),
                crop_code=crop_code,
                variety="HD-2967" if crop_code == "WHEAT" else "PR-126" if crop_code == "PADDY" else "RH-749",
                estimated_quantity_quintals=round(random.uniform(20, 100), 1),
                season="Rabi" if crop_code in ["WHEAT", "MUSTARD"] else "Kharif",
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
                today_str = today.strftime('%Y%m%d')
                token_number = f"TK-{today_str}-{random.randint(100, 999)}"
                
                status = random.choice([
                    BookingStatus.BOOKED, BookingStatus.CONFIRMED, 
                    BookingStatus.ARRIVED, BookingStatus.QUALITY_CHECK
                ])
                
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
                    status=status,
                    qr_code=f"data:image/png;base64,QR_{token_number}",
                    queue_position=slot.booked_count + 1,
                    estimated_wait_min=(slot.booked_count + 1) * 8 // max(centre.active_counters, 1),
                )
                session.add(booking)
                slot.booked_count += 1
        
        await session.commit()
        print("Demo data seeded successfully!")
        break


if __name__ == "__main__":
    asyncio.run(seed())