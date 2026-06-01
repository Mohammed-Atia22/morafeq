// src/services/propertyService.js
// --------------------------------------------------
// All property API calls live here.
// Swap VITE_USE_MOCK=false to hit real backend.
// --------------------------------------------------

import config from "../config/env";
import API from "../config/apiEndpoints";
import httpClient from "./httpClient";
import { MOCK_DELAY }                              from "../mocks/auth";
import { MOCK_FEATURED_RESPONSE, MOCK_PROPERTIES_RESPONSE, MOCK_PROPERTIES } from "../mocks";

const delay = (ms = MOCK_DELAY) => new Promise((res) => setTimeout(res, ms));

// ─────────────────────────────────────────────────────
const propertyService = {

  // GET /properties/featured
  // Returns: { data: Property[] }
  getFeatured: async () => {
    if (config.useMock) {
      await delay();
      return MOCK_FEATURED_RESPONSE;
    }

    return httpClient(API.PROPERTIES.FEATURED);
  },

  // GET /properties?city=&area=&min_price=&max_price=&type=&page=
  // Returns: { data: Property[], meta: { total, page, per_page, total_pages } }
  getAll: async (filters = {}) => {
    if (config.useMock) {
      await delay();

      // Apply filters on mock data so UI filtering works now
      let results = [...MOCK_PROPERTIES];

      if (filters.city) {
        results = results.filter((p) =>
          p.location.city.includes(filters.city)
        );
      }
      if (filters.area) {
        results = results.filter((p) =>
          p.location.area.includes(filters.area)
        );
      }
      if (filters.min_price) {
        results = results.filter((p) => p.price >= Number(filters.min_price));
      }
      if (filters.max_price) {
        results = results.filter((p) => p.price <= Number(filters.max_price));
      }
      if (filters.type) {
        results = results.filter((p) => p.type === filters.type);
      }
      if (filters.gender) {
        results = results.filter(
          (p) =>
            p.preferences.gender === filters.gender ||
            p.preferences.gender === "any"
        );
      }

      return {
        data: results,
        meta: {
          total: results.length,
          page: 1,
          per_page: 10,
          total_pages: 1,
        },
      };
    }

    const params = new URLSearchParams(
      // Remove empty values before sending
      Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== "" && v != null)
      )
    );

    return httpClient(`${API.PROPERTIES.LIST}?${params}`);
  },

  // GET /properties/:id
  // Returns: { data: Property }
  getById: async (id) => {
    if (config.useMock) {
      await delay();
      const property = MOCK_PROPERTIES.find((p) => p.id === id);
      if (!property) {
        const error = new Error("العقار غير موجود");
        error.status = 404;
        throw error;
      }
      return { data: property };
    }

    return httpClient(API.PROPERTIES.DETAIL(id));
  },
};

export default propertyService;