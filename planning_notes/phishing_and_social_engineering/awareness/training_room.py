#!/usr/bin/env python3
"""
The awareness training room, shared by every awareness shell
(TRAINING_ROOM_PLAN.md §4–§6).

Each company has its own map type (room_aw_*, copies of room_uni_seminar), but
the skeleton is the same in all four: the host spot, the kiosk's map slot and the
player's start. So the generators share this one module and only the map type,
the chat background and the lighting change by company.

The kiosk needs no position: the map's `kiosk` slot (x 238, y 140, top-left
238,80) places it once the scenario object has `"type": "kiosk"` and no
`position`.

Lighting lives in training_room_lighting.json beside this file.

Not yet imported by the generators (that wiring is the next step); for a look:
  python3 training_room.py              # every company's room fields, as JSON
  python3 training_room.py quayholt_insurance
"""
import copy
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

HOST_POSITION = {'x': 5.5, 'y': 3.8}     # sprite centre in tiles (176,122); feet near y 154, head clear of the skirting (ROOMS_REVIEW_C1 t2)
START_POSITION = {'x': 6, 'y': 6.2}      # between host and kiosk (192,198)

_LIGHTING = json.loads((HERE / 'training_room_lighting.json').read_text())

ROOMS = {
    'brightwell_foods':   {'type': 'room_aw_brightwell',    'chatBackground': None},
    'tarrowby_logistics': {'type': 'room_aw_tarrowby',      'chatBackground': None},
    'quayholt_insurance': {'type': 'room_aw_quayholt',      'chatBackground': None},
    'merrin_sallow':      {'type': 'room_aw_merrin_sallow', 'chatBackground': None},
}
for _co, _room in ROOMS.items():
    _room['ambient'] = _LIGHTING[_co]['scenario'].get('ambient')
    _room['room_lighting'] = _LIGHTING[_co]['room']


def scenario_lighting(company):
    """The scenario-level block: {"enabled": true, "defaultMode": "on"}, plus the
    company's ambient when it has one."""
    return copy.deepcopy(_LIGHTING[company]['scenario'])


def room_fields(company):
    """Fields for rooms.training_room: type, chatBackground (only once the POV
    background exists) and lighting."""
    room = ROOMS[company]
    out = {'type': room['type']}
    if room['chatBackground']:
        out['chatBackground'] = room['chatBackground']
    out['lighting'] = copy.deepcopy(room['room_lighting'])
    return out


if __name__ == '__main__':
    companies = sys.argv[1:] or list(ROOMS)
    print(json.dumps({co: {'scenario.lighting': scenario_lighting(co),
                           'startPosition': START_POSITION,
                           'host.position': HOST_POSITION,
                           'rooms.training_room': room_fields(co)} for co in companies}, indent=2))
