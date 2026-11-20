// Shared by the render scripts: which mission an edit list belongs to, and where its takes and renders live.
// The edit list carries "mission": "m01" (a scenario id such as "m01_first_contact" is accepted and shortened to "m01").
import path from 'node:path';
export function missionKey(edit, file = '') {
  if (!edit.mission || typeof edit.mission !== 'string') throw new Error(`${file || 'edit list'}: "mission" field missing (for example "mission": "m01")`);
  return edit.mission.replace(/^((?:m|sis)\d+)(_.*)?$/, '$1');
}
export const takesDirFor = (repo, edit, file) => path.join(repo, 'video_out', missionKey(edit, file), 'takes');
export const rendersDirFor = (repo, edit, file) => path.join(repo, 'video_out', missionKey(edit, file), 'renders');
