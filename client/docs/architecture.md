Architecture Documentation:

//This model is made in part with AI to organize our code for future growth.

food-app/
├── README.md                  # Setup, team conventions, roadmap
├── .gitignore                 # Include .env, node_modules/
├── .env.example               # Placeholder keys (never commit real ones)
│
├── docs/
│   ├── architecture.md        # How the pieces fit together
│   ├── api-contract.md        # Planned endpoints (see below)
│   └── database-schema.sql    # Draft MySQL tables
│
├── client/                    # Everything the browser loads
│   ├── index.html             # App shell + navigation
│   ├── css/
│   │   ├── base.css           # Variables, reset, typography
│   │   ├── layout.css         # Nav, grid, page structure
│   │   └── components.css     # Cards, buttons, forms, badges
│   ├── js/
│   │   ├── main.js            # Entry point, starts the router
│   │   ├── router.js          # Switches between views
│   │   ├── state.js           # Simple shared app state
│   │   ├── services/          # THE KEY LAYER (see below)
│   │   │   ├── inventoryService.js
│   │   │   ├── recipeService.js
│   │   │   ├── scanService.js
│   │   │   └── preferencesService.js
│   │   ├── views/             # One file per screen/feature
│   │   │   ├── inventoryView.js
│   │   │   ├── recipesView.js
│   │   │   ├── scanView.js
│   │   │   └── preferencesView.js
│   │   ├── components/        # Reusable UI pieces
│   │   │   ├── foodItemCard.js
│   │   │   ├── recipeCard.js
│   │   │   └── expiryBadge.js
│   │   └── utils/
│   │       ├── dates.js       # Expiry calculations
│   │       └── dom.js         # Small helper functions
│   ├── mock-data/
│   │   ├── inventory.json
│   │   ├── recipes.json
│   │   └── scan-results.json
│   └── assets/                # Images, icons
│
└── server/                    # Empty for now, ready for later sprints
    ├── README.md              # Notes on planned stack
    ├── routes/                # inventory, recipes, scan, auth
    ├── services/              # aiService, ocrService, etc.
    ├── db/                    # Connection + migrations
    └── app.js