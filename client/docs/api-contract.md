//For future planned endpoints and api documentation
//FYI NEVER commit an api key

GET    /api/inventory
POST   /api/inventory
PUT    /api/inventory/:id
DELETE /api/inventory/:id
POST   /api/recipes/suggest    body: { priority, context, preferences }
POST   /api/scan/barcode       body: { code }
POST   /api/scan/receipt       body: image upload
GET/PUT /api/preferences