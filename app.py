from flask import Flask, request, jsonify, send_file, send_from_directory
from icalendar import Calendar, Event
from datetime import datetime, date, timedelta
import pytz
import requests
import json
import re
import io
from collections import OrderedDict

app = Flask(__name__)

# 메모리 캐시 (FIFO Queue)
timetable_cache = OrderedDict()
MAX_CACHE_SIZE = 10


def cleanup_cache():
    """최대 크기를 초과한 오래된 항목 삭제 (FIFO)"""
    while len(timetable_cache) >= MAX_CACHE_SIZE:
        timetable_cache.popitem(last=False)


def save_timetable_cache(std_id, data):
    """메모리에 시간표 데이터 저장"""
    cleanup_cache()
    timetable_cache[std_id] = data


def load_timetable_cache(std_id):
    """메모리에서 시간표 데이터 로드"""
    return timetable_cache.get(std_id)

CLASS_TIME = [
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
    ("21:30", "22:20"),  # 12교시
]

DAY_MAP = {
    'value1': 0,
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
BLOCK_STARTS = {1, 5, 10}
TZ = pytz.timezone('Asia/Seoul')


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/timetable')
def get_timetable():
    std_id = request.args.get('stdId', '').strip()

    if not re.match(r'^\d{2}-\d{3}$', std_id):
        return jsonify({'error': '학번 형식이 올바르지 않습니다. (예: 24-074)'}), 400

    # 메모리 캐시 확인
    cached = load_timetable_cache(std_id)
    if cached:
        return jsonify(cached)

    try:
        resp = requests.get(
            f'https://api.ksain.net/ksain/timetable.php?stuId={std_id}',
            timeout=10
        )
        resp.raise_for_status()
    except Exception as e:
        return jsonify({'error': f'시간표 API 호출 실패: {str(e)}'}), 502

    try:
        outer = json.loads(resp.content)
        inner_data = json.loads(outer['data'])
    except Exception:
        return jsonify({'error': '시간표 데이터 파싱 실패'}), 502

    for row in inner_data:
        for key, value in row.items():
            if key.startswith('value') and value is not None:
                parts = value.split('<br>')
                row[key] = {
                    'subject': parts[0] if len(parts) > 0 else None,
                    'class':   parts[1] if len(parts) > 1 else None,
                    'teacher': parts[2] if len(parts) > 2 else None,
                    'room':    parts[3] if len(parts) > 3 else None,
                }

    # 메모리 캐시 저장
    save_timetable_cache(std_id, inner_data)
    return jsonify(inner_data)


@app.route('/api/generate-ics', methods=['POST'])
def generate_ics():
    body = request.get_json()
    if not body:
        return jsonify({'error': '요청 본문이 없습니다.'}), 400

    std_id   = body.get('stdId', 'timetable')
    timetable = body.get('timetable', [])
    config   = body.get('config', {})

    try:
        semester_start = date.fromisoformat(config.get('semesterStart', '2026-03-03'))
        semester_end   = date.fromisoformat(config.get('semesterEnd',   '2026-06-20'))
        no_class_dates = [date.fromisoformat(d) for d in config.get('noClassDates', [])]
    except ValueError as e:
        return jsonify({'error': f'날짜 형식 오류: {str(e)}'}), 400

    # slot_map 구성
    slot_map = {}
    for row in timetable:
        kyosi = int(row['kyosi'])
        for value_key in DAY_MAP:
            info = row.get(value_key)
            if info is not None:
                slot_map[(value_key, kyosi)] = info

    # 연속 교시 병합
    merged = {}
    for (value_key, kyosi), info in sorted(slot_map.items(), key=lambda x: (x[0][0], x[0][1])):
        if kyosi not in BLOCK_STARTS:
            prev = slot_map.get((value_key, kyosi - 1))
            if prev is not None and prev['subject'] == info['subject']:
                for start_k in range(kyosi - 1, 0, -1):
                    if (value_key, start_k) in merged:
                        merged[(value_key, start_k)] = (merged[(value_key, start_k)][0], kyosi)
                        break
                continue
        merged[(value_key, kyosi)] = (info, kyosi)

    cal = Calendar()
    cal.add('prodid', '-//Class Calendar//EN')
    cal.add('version', '2.0')

    for (value_key, start_kyosi), (info, end_kyosi) in merged.items():
        if start_kyosi - 1 >= len(CLASS_TIME) or end_kyosi - 1 >= len(CLASS_TIME):
            continue

        weekday_idx = DAY_MAP[value_key]
        sh, sm = map(int, CLASS_TIME[start_kyosi - 1][0].split(':'))
        eh, em = map(int, CLASS_TIME[end_kyosi - 1][1].split(':'))

        days_ahead = weekday_idx - semester_start.weekday()
        if days_ahead < 0:
            days_ahead += 7
        first_day = semester_start + timedelta(days=days_ahead)

        dtstart = TZ.localize(datetime(first_day.year, first_day.month, first_day.day, sh, sm))
        dtend   = TZ.localize(datetime(first_day.year, first_day.month, first_day.day, eh, em))
        until   = TZ.localize(datetime(semester_end.year, semester_end.month, semester_end.day, 23, 59))

        event = Event()
        event.add('summary',     info['subject'])
        event.add('dtstart',     dtstart)
        event.add('dtend',       dtend)
        event.add('location',    info.get('room') or '')
        event.add('description', f"교수: {info.get('teacher')}\n분반: {info.get('class')}")
        event.add('rrule', {'FREQ': 'WEEKLY', 'BYDAY': [RRULE_DAY[value_key]], 'UNTIL': until})

        exdates = [
            TZ.localize(datetime(d.year, d.month, d.day, sh, sm))
            for d in no_class_dates
            if d.weekday() == weekday_idx and first_day <= d <= semester_end
        ]
        if exdates:
            event.add('exdate', exdates)

        cal.add_component(event)

    ics_bytes = io.BytesIO(cal.to_ical())
    return send_file(
        ics_bytes,
        mimetype='text/calendar',
        as_attachment=True,
        download_name=f'timetable_{std_id}.ics'
    )


if __name__ == '__main__':
    app.run(debug=False, port=5000)
