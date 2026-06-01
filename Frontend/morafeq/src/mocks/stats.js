// src/mocks/stats.js
// --------------------------------------------------
// Mock data for platform stats (landing page stats bar).
// Field names here = exact field names backend must return.
// --------------------------------------------------

// GET /stats/platform → returns this shape
export const MOCK_STATS_RESPONSE = {
  data: {
    properties_count: 5000,      // total verified listings
    students_count: 15000,       // total happy students
    universities_count: 50,      // universities covered
    satisfaction_rate: 98,       // percentage (no % sign, frontend adds it)
  },
};