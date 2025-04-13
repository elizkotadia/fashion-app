CREATE TABLE IF NOT EXISTS wardrobe_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    occasions TEXT NOT NULL, -- JSON array of occasions
    image_path TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 