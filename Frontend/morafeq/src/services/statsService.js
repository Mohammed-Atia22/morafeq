// src/services/statsService.js
// --------------------------------------------------
// Platform stats API calls (landing page stats bar).
// --------------------------------------------------

import config from "../config/env";
import API from "../config/apiEndpoints";
import httpClient from "./httpClient";
import { MOCK_DELAY }              from "../mocks/auth";
import { MOCK_STATS_RESPONSE }     from "../mocks";

const delay = (ms = MOCK_DELAY) => new Promise((res) => setTimeout(res, ms));

const statsService = {

  // GET /stats/platform
  // Returns: { data: { properties_count, students_count, universities_count, satisfaction_rate } }
  getPlatformStats: async () => {
    if (config.useMock) {
      await delay();
      return MOCK_STATS_RESPONSE;
    }

    return httpClient(API.STATS.PLATFORM);
  },
};

export default statsService;