//Follow the architecture rules in .ai/frontend-architecture-rules.md


Use this as a permanent architecture/system prompt for [OpenAI Codex](https://openai.com/codex?utm_source=chatgpt.com) whenever you ask it to build or modify frontend features in your project.

You are working on a React + Vite scalable frontend application.

IMPORTANT:
You MUST strictly follow the architecture rules below when creating, editing, refactoring, or extending any frontend feature.

==================================================
CORE FRONTEND ARCHITECTURE PHILOSOPHY
=====================================

This project follows:

* Feature-Based Architecture
* Domain-Driven Frontend Design
* Scalable React Structure

The project structure is:

src/
├── app/
├── features/
├── shared/
├── pages/
├── assets/
├── App.jsx
├── main.jsx
└── index.css

==================================================

1. THINK IN FEATURES, NOT PAGES
   ==================================================

❌ WRONG:
"I need a new page"

✅ CORRECT:
"I need a new feature/domain"

Every business domain MUST live inside:

features/

Examples:

* auth
* listings
* owner
* expatriate
* bookings
* messages
* reviews
* payments
* favorites

==================================================
2. PAGES BELONG INSIDE FEATURES
===============================

❌ BAD:
pages/SearchPage.jsx

✅ GOOD:
features/expatriate/pages/ExpatriateSearchPage.jsx

Global pages should ONLY contain:

* HomePage
* LandingPage
* NotFoundPage

==================================================
3. SHARED CODE GOES ONLY INSIDE shared/
=======================================

ONLY move code into shared/ if multiple features use it.

Examples:
shared/components/ui/Button.jsx
shared/components/ui/Input.jsx
shared/components/maps/LocationPickerMap.jsx
shared/components/navigation/AppNavbar.jsx

==================================================
4. FEATURE-SPECIFIC UI STAYS INSIDE FEATURE
===========================================

❌ BAD:
shared/components/ListingCard.jsx

if only listings use it.

✅ GOOD:
features/listings/components/ListingCard.jsx

Each feature owns its own business UI.

==================================================
5. COMPONENTS = UI ONLY
=======================

Components should:

* render UI
* receive props
* handle small local UI state

Components should NOT:

* contain huge API logic
* build backend queries
* contain large business logic
* contain complex state management

==================================================
6. HOOKS = BUSINESS LOGIC
=========================

Use hooks for:

* data fetching
* search logic
* filters
* loading states
* complex state
* reusable business behavior

Examples:
hooks/useListingsSearch.js
hooks/useDestinationSearch.js
hooks/useAuth.js

==================================================
7. SERVICES = API COMMUNICATION ONLY
====================================

Services should ONLY:

* call backend APIs
* send requests
* return responses

Examples:
services/listingsApi.js
services/locationsApi.js
services/authApi.js

Services must NOT:

* contain JSX
* manage UI
* manage components

==================================================
8. UTILS = PURE HELPERS
=======================

Utils should contain:

* query builders
* formatting helpers
* calculations
* transformations

Examples:
utils/buildListingsQuery.js
utils/formatPrice.js

Utils must NOT:

* contain React code
* contain JSX
* manage state

==================================================
9. LAYOUTS ARE APP-LEVEL
========================

Layouts belong in:

app/layouts/

Examples:

* MainLayout.jsx
* OwnerLayout.jsx
* ExpatriateLayout.jsx
* DashboardLayout.jsx

Layouts handle:

* sidebar
* navbar
* outlet
* page structure

==================================================
10. ROUTES BELONG IN app/routes
===============================

Examples:
app/routes/AppRoutes.jsx
app/routes/ProtectedRoute.jsx
app/routes/GuestRoute.jsx

==================================================
11. LARGE FEATURES NEED INTERNAL STRUCTURE
==========================================

When features grow, organize components internally.

❌ BAD:
components/
40 files...

✅ GOOD:
components/
search/
sidebar/
home/
forms/

==================================================
12. KEEP PAGES SMALL
====================

Pages should mostly compose components.

GOOD:

<Layout>
  <Sidebar />
  <SearchBar />
  <ListingsGrid />
</Layout>

Pages should NOT:

* become 1000-line files
* contain heavy API logic
* manage huge application state

==================================================
13. SPLIT LARGE COMPONENTS EARLY
================================

If a component exceeds ~300–400 lines:
split it.

Example:
AddListingForm/
index.jsx
Step1Location.jsx
Step2Details.jsx
Step3Rules.jsx
AmenitiesSelector.jsx

==================================================
14. MIRROR BACKEND DOMAINS
==========================

Frontend features should mirror backend modules.

Example:

Backend:

* auth
* listings
* reviews
* messages

Frontend:
features/auth/
features/listings/
features/reviews/
features/messages/

==================================================
15. GLOBAL ROOT FOLDERS MUST STAY SMALL
=======================================

Do NOT create huge global folders like:

components/
services/
hooks/
utils/

for the whole app.

That becomes unmaintainable.

Prefer feature ownership first.

==================================================
16. FEATURE FIRST, SHARED SECOND
================================

Always ask:

"Is this used by multiple features?"

If:

* NO → keep inside feature
* YES → move to shared/

==================================================
17. ROLE-BASED APP STRUCTURE
============================

This project has:

* Owner side
* Expatriate side

Role-specific flows should stay inside their own feature domains.

Examples:
features/owner/
features/expatriate/

==================================================
18. FRONTEND RESPONSIBILITY RULES
=================================

Pages:

* compose UI

Components:

* render UI

Hooks:

* manage business logic

Services:

* communicate with backend

Utils:

* provide helpers

Shared:

* reusable cross-feature code

Features:

* own business domains

==================================================
19. WHEN ADDING A NEW FEATURE
=============================

Example:
Favorites feature.

Step 1:
Create feature folder:

features/favorites/

Step 2:
Create structure:

components/
pages/
hooks/
services/
utils/

Step 3:
Create API service:

favoritesApi.js

Step 4:
Create hooks:

useFavorites.js

Step 5:
Create UI:

FavoriteButton.jsx
FavoritesPage.jsx

Step 6:
Register routes in:

app/routes/AppRoutes.jsx

==================================================
20. IMPORTANT IMPLEMENTATION RULES
==================================

* Preserve clean architecture.
* Prefer composition over giant components.
* Avoid duplicated business logic.
* Avoid giant files.
* Avoid deeply nested prop drilling where possible.
* Prefer reusable hooks.
* Keep backend communication isolated in services.
* Keep UI reusable and modular.
* Follow separation of concerns strictly.
* Keep naming consistent with backend modules.
* Avoid premature abstractions.
* Refactor incrementally without breaking functionality.

==================================================
21. OUTPUT REQUIREMENTS
=======================

Whenever implementing a new feature:

1. Explain folder placement decisions
2. Explain why code belongs in specific layers
3. Keep imports organized
4. Avoid unnecessary rewrites
5. Preserve existing functionality
6. Keep implementation scalable
7. Follow the architecture rules above strictly
