const toMinutes = (time) =>{
    const [h,m] = time.split(":").map(Number);
    return h * 60 + m;
};

const doesOverlap = (startA, endA, startB, endB) =>{
    return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);

};

const hasConflict = (existingSlots, newStart, newEnd) =>{
    for(const slot of existingSlots){
        if(doesOverlap(slot.startTime, slot.endTime, newStart, newEnd)){
            return true;
        }
    }

    return false;
}

const suggestNextFreeSlot = (existingSlots, durationMinutes, dayStart = "09:00", dayEnd = "21:00")=>{
    const sorted = [...existingSlots].sort(
        (a,b) => toMinutes(a.startTime) - toMinutes(b.startTime)
    );

    let cursor = toMinutes(dayStart);
    const endOfDay = toMinutes(dayEnd);

    for(const slot of sorted){
        const slotStart = toMinutes(slot.startTime);
        const slotEnd = toMinutes(slot.endTime);


        if(slotStart - cursor >= durationMinutes){
            return minutesToTime(cursor);
        }

        cursor = Math.max(cursor, slotEnd);
    }

    if(endOfDay-cursor >= durationMinutes)
    {
        return minutesToTime(cursor);
    }

    return null;
};


const minutesToTime = (mins) => {
    const h = Math.floor(mins/60).toString().padStart(2, "0");
    const m = (mins%60).toString().padStart(2, "0");
    return `${h}:${m}`;
}

module.exports = {hasConflict, suggestNextFreeSlot, doesOverlap};

