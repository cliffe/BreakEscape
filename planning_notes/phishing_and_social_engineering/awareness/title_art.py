"""Painted title art (owner pick, 2026-10-30) for the awareness episodes.

mission.json "title_art" is a path under public/break_escape/assets/. The full episode and
its _defend twin share one image, named after the full episode's folder. Check forms
(pre/post) have no art. Used by every gen_*.py that writes a mission.json.
"""
import os

ART_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..',
                       'public', 'break_escape', 'assets', 'title_art')

KEYS = {
    'awareness_core_00_first_play', 'awareness_core_17_annual_2027_defend',
    'awareness_e1_invoice_fraud', 'awareness_e2_cv_lures', 'awareness_e3_helpdesk_reset',
    'awareness_e4_exec_whaling', 'awareness_e5_signin_pages', 'awareness_e6_texts_and_qr',
    'awareness_e7_voice_ceo', 'awareness_e8_after_the_click', 'awareness_e9_passwords',
    'awareness_e10_downloads_and_fake_checks', 'awareness_e11_misdirected_data',
    'awareness_e12_visitor_tailgater', 'awareness_e13_ai_assistant', 'awareness_e14_social_media',
    'awareness_e15_shadow_it', 'awareness_e16_insider_risk', 'awareness_e17_acceptable_use_defend',
    'awareness_e18_credential_attacks_at_scale', 'awareness_e19_malware_and_updates',
    'awareness_e20_remote_and_mobile_working',
}


def title_art_for(mission):
    """The art key for a scenario folder name, or None."""
    if mission in KEYS:
        return mission
    if mission.endswith('_defend') and mission[:-len('_defend')] in KEYS:
        return mission[:-len('_defend')]
    return None


def with_title_art(meta, mission):
    """meta with "title_art" added right after "ui_theme" (or at the end); unchanged if no art."""
    key = title_art_for(mission)
    if not key:
        return meta
    out = {}
    for k, v in meta.items():
        if k == 'title_art':
            continue
        out[k] = v
        if k == 'ui_theme':
            out['title_art'] = f'title_art/{key}.jpg'
    out.setdefault('title_art', f'title_art/{key}.jpg')
    return out
