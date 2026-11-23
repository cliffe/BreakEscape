"""Painted title art (owner pick, 2026-10-30) for the awareness episodes.

mission.json "title_art" is a path under public/break_escape/assets/. The full episode and
its _defend twin share one image, named after the full episode's folder. Check forms
(pre/post) have no art. Used by every gen_*.py that writes a mission.json.
"""
import os

ART_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..',
                       'public', 'break_escape', 'assets', 'title_art')

KEYS = {
    'ca00_first_play', 'ca_annual_2027_defend',
    'ca01_invoice_fraud', 'ca02_cv_lures', 'ca03_helpdesk_reset',
    'ca04_exec_whaling', 'ca05_signin_pages', 'ca06_texts_and_qr',
    'ca07_voice_ceo', 'ca08_after_the_click', 'ca09_passwords',
    'ca10_downloads_and_fake_checks', 'ca11_misdirected_data',
    'ca12_visitor_tailgater', 'ca13_ai_assistant', 'ca14_social_media',
    'ca15_shadow_it', 'ca16_insider_risk', 'ca17_acceptable_use_defend',
    'ca18_credential_attacks_at_scale', 'ca19_malware_and_updates',
    'ca20_remote_and_mobile_working',
}


def title_art_for(mission):
    """The art key for a scenario folder name, or None."""
    if mission in KEYS:
        return mission
    if mission.endswith('_defend') and mission[:-len('_defend')] in KEYS:
        return mission[:-len('_defend')]
    return None


def with_title_art(meta, mission):
    """meta with "title_art" and "title_style" added right after "ui_theme" (or at the end).

    The check shells have no art but still get the CA loading screen (D353); any other mission without art is unchanged."""
    key = title_art_for(mission)
    if not key and not mission.startswith(('ca_pre_', 'ca_post_')):
        return meta
    out = {}
    for k, v in meta.items():
        if k in ('title_art', 'title_style'):
            continue
        out[k] = v
        if k == 'ui_theme':
            if key:
                out['title_art'] = f'title_art/{key}.jpg'
            out['title_style'] = 'ca'  # the Cyber Aware loading screen (D350)
    if key:
        out.setdefault('title_art', f'title_art/{key}.jpg')
    out.setdefault('title_style', 'ca')
    return out
