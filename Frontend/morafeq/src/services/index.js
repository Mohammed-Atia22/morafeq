// src/services/index.js
// --------------------------------------------------
// Barrel export — import any service from one place.
// e.g: import { authService, propertyService } from "../services"
// --------------------------------------------------

export { default as authService }     from "./authService";
export { default as propertyService } from "./propertyService";
export { default as statsService }    from "./statsService";
export { default as httpClient }      from "./httpClient";