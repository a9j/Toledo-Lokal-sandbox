import { Navigate } from 'react-router-dom';
import { CIRCLES_DIRECTORY_ENABLED } from '@/lib/flags';

// The canonical home for the founding cohort. Both the Circles tab and the
// post-QR join-success screen resolve here — one destination, two doorways.
const DEFAULT_COHORT_PATH = '/charter-100';

/**
 * Single landing resolver for the Circles tab.
 *
 * Cohort-first (today): the only community is the Charter 100 cohort, so the
 * tab lands directly on the cohort page. The tab must never present as a
 * one-item directory. Non-members are sent here too — the cohort page already
 * renders the closed/founding framing and an invite prompt for them.
 *
 * Directory-later: when multiple Circles exist, flip CIRCLES_DIRECTORY_ENABLED
 * (src/lib/flags.ts) to render the directory with the user's cohort shown as
 * "your cohort." That swap is a config change, not a rebuild — the directory
 * branch below is the only thing left to build out.
 */
export default function CirclesLanding() {
  if (CIRCLES_DIRECTORY_ENABLED) {
    // Directory branch — stubbed until multiple Circles exist. Falls back to
    // the cohort page so the tab is never dead while the directory is built.
    return <Navigate to={DEFAULT_COHORT_PATH} replace />;
  }

  return <Navigate to={DEFAULT_COHORT_PATH} replace />;
}
