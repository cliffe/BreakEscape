// t05b_inbox_narrow: t05_inbox with the mail client capped to 760 px (NARROW_INBOX_CSS) for 9:16 and 1:1; same marks, same assertions.
import { makeSetup, makeRun } from './t05_inbox.mjs';
export const setup = makeSetup(true);
export default makeRun(true);
