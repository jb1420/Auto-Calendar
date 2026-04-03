from icalendar import Calendar, Event
from datetime import datetime, date, timedelta
import pytz
import json
import requests
import re

import time


def get_data(stdID:str):
    # stdID 정규식 체크(OO-OOO 형식)
    pattern = r'^\d{2}-\d{3}$'
    if not re.match(pattern, stdID):
        raise ValueError("Invalid student ID format. Expected format: OO-OOO")

    response = requests.get(f"https://api.ksain.net/ksain/timetable.php?stuId={stdID}")

    data = json.loads(response.content)
    inner_data = json.loads(data['data'])

    for row in inner_data:
        for key, value in row.items():
            if key.startswith('value') and value is not None:
                parts = value.split('<br>')
                row[key] = {
                    'subject': parts[0] if len(parts) > 0 else None,
                    'class': parts[1] if len(parts) > 1 else None,
                    'teacher': parts[2] if len(parts) > 2 else None,
                    'room': parts[3] if len(parts) > 3 else None,
                }
            elif key.startswith('value') and value is None:
                row[key] = None

    json.dump(inner_data, open(f'output_{stdID[0:2]+stdID[3:]}.json', 'w', encoding='utf-8'),
            ensure_ascii=False, indent=2)

# 교시별 시작/종료 시간 (인덱스 0 = 1교시)
class_time = [
    ("08:40", "09:30"),
    ("09:40", "10:30"),
    ("10:40", "11:30"),
    ("11:40", "12:30"),
    ("13:40", "14:30"),
    ("14:40", "15:30"),
    ("15:40", "16:30"),
    ("16:40", "17:30"),
    ("17:40", "18:30"),
    ("19:30", "20:20"),
    ("20:30", "21:20"),
]

# value1=월(MO), value2=화(TU), value3=수(WE), value4=목(TH), value5=금(FR)
DAY_MAP = {
    'value1': 0,  # 월요일 weekday index
    'value2': 1,
    'value3': 2,
    'value4': 3,
    'value5': 4,
}
RRULE_DAY = {
    'value1': 'MO',
    'value2': 'TU',
    'value3': 'WE',
    'value4': 'TH',
    'value5': 'FR',
}

# 학기 시작/종료 날짜 설정
SEMESTER_START = date(2026, 3, 3)   # 학기 시작일 (월요일)
SEMESTER_END   = date(2026, 6, 20)  # 학기 종료일

# 수업 없는 날 (공휴일, 시험기간 등) - 이 날짜에 해당하는 수업은 생성되지 않음
NO_CLASS_DATES = [
    # 공휴일
    date(2026, 3, 2),   # 삼일절
    date(2026, 5, 5),   # 어린이날
    date(2026, 5,25),   # 어린이날 대체공휴일
    date(2026, 6, 1),   # 어린이날 대체공휴일
    date(2026, 6, 6),   # 현충일
    # 시험기간 예시 (날짜 범위는 직접 추가)
    date(2026, 4, 14),
    date(2026, 4, 15),
    date(2026, 4, 16),
    date(2026, 4, 17),

    date(2026, 6, 15),
    date(2026, 6, 16),
    date(2026, 6, 17),
    date(2026, 6, 18),
    date(2026, 6, 19),
]
# 각 블록의 첫 교시 (1-based): 이 교시들은 이전 교시와 연결되지 않음
BLOCK_STARTS = {1, 5, 10}

tz = pytz.timezone('Asia/Seoul')


def upload_data(stdID: str):
    filename = f'output_{stdID[0:2]+stdID[3:]}.json'
    timetable = json.load(open(filename, encoding='utf-8'))

    # 구버전 파일(value가 list) 감지
    for row in timetable:
        for key in DAY_MAP:
            val = row.get(key)
            if isinstance(val, list):
                raise ValueError(f"{filename}이 구버전 형식입니다. get_data()를 다시 실행하세요.")


    # (value_key, kyosi_1based) -> info 로 먼저 수집
    slot_map = {}
    for row in timetable:
        kyosi = int(row['kyosi'])
        for value_key in DAY_MAP:
            info = row.get(value_key)
            if info is not None:
                slot_map[(value_key, kyosi)] = info

    # 연속 교시를 합쳐서 최종 이벤트 목록 생성
    # { (value_key, start_kyosi): (info, end_kyosi) }
    merged = {}
    for (value_key, kyosi), info in sorted(slot_map.items(), key=lambda x: (x[0][0], x[0][1])):
        if kyosi not in BLOCK_STARTS:
            prev = slot_map.get((value_key, kyosi - 1))
            if prev is not None and prev['subject'] == info['subject']:
                # 이전 교시와 같은 수업 → 이전 항목의 end_kyosi를 연장
                # merged에서 이 (value_key, kyosi-1)의 시작 교시를 찾아서 연장
                for start_k in range(kyosi - 1, 0, -1):
                    if (value_key, start_k) in merged:
                        merged[(value_key, start_k)] = (merged[(value_key, start_k)][0], kyosi)
                        break
                continue
        merged[(value_key, kyosi)] = (info, kyosi)

    cal = Calendar()
    cal.add('prodid', '-//Class Calendar//EN')
    cal.add('version', '2.0')

    events_data = []

    for (value_key, start_kyosi), (info, end_kyosi) in merged.items():
        weekday_idx = DAY_MAP[value_key]

        start_str = class_time[start_kyosi - 1][0]
        end_str   = class_time[end_kyosi - 1][1]
        sh, sm = map(int, start_str.split(':'))
        eh, em = map(int, end_str.split(':'))

        days_ahead = weekday_idx - SEMESTER_START.weekday()
        if days_ahead < 0:
            days_ahead += 7
        first_day = SEMESTER_START + timedelta(days=days_ahead)

        dtstart = tz.localize(datetime(first_day.year, first_day.month, first_day.day, sh, sm))
        dtend   = tz.localize(datetime(first_day.year, first_day.month, first_day.day, eh, em))
        until   = tz.localize(datetime(SEMESTER_END.year, SEMESTER_END.month, SEMESTER_END.day, 23, 59))

        event = Event()
        event.add('summary', info['subject'])
        event.add('dtstart', dtstart)
        event.add('dtend', dtend)
        event.add('location', info['room'] or '')
        event.add('description', f"교수: {info['teacher']}\n분반: {info['class']}")
        event.add('rrule', {'FREQ': 'WEEKLY', 'BYDAY': [RRULE_DAY[value_key]], 'UNTIL': until})

        exdates = [
            tz.localize(datetime(d.year, d.month, d.day, sh, sm))
            for d in NO_CLASS_DATES
            if d.weekday() == weekday_idx and first_day <= d <= SEMESTER_END
        ]
        if exdates:
            event.add('exdate', exdates)

        cal.add_component(event)
        events_data.append(info['subject'])

    with open(f'events_{stdID}.ics', 'wb') as f:
        f.write(cal.to_ical())

    print(f'{len(events_data)}개 이벤트가 events.ics에 저장되었습니다.')




if __name__ == "__main__":
        stdID=  input()
        get_data(stdID)
        upload_data(stdID)