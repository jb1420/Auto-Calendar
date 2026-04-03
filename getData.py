import requests
import json

def get_data(stdID:str):
    # stdID 정규식 체크(OO-OOO 형식)
    import re
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

    json.dump(inner_data, open('output.json', 'w', encoding='utf-8'),
            ensure_ascii=False, indent=2)