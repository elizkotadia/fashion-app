const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.json());

// Get all wardrobe items
app.get('/api/items', (req, res) => {
    db.all('SELECT * FROM wardrobe_items ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            console.error('Error fetching items:', err);
            return res.status(500).json({ error: 'Failed to fetch items' });
        }
        console.log(JSON.stringify(rows));
        res.json(rows.map(row => ({
            ...row,
            occasions: JSON.parse(row.occasions),
            imagePath: row.image_path
        })));
    });
});

// Add new wardrobe item
app.post('/api/items', upload.single('image'), (req, res) => {
    const { type, color, occasions } = req.body;
    const imagePath = `images/uploads/${req?.file?.filename}`;

    // Parse occasions if it's a string, otherwise use as is
    const occasionsArray = typeof occasions === 'string' ? JSON.parse(occasions) : occasions;
    const occasionsString = JSON.stringify(occasionsArray);

    db.run(
        'INSERT INTO wardrobe_items (type, color, occasions, image_path) VALUES (?, ?, ?, ?)',
        [type, color, occasionsString, imagePath],
        function(err) {
            if (err) {
                console.error('Error adding item:', err);
                return res.status(500).json({ error: 'Failed to add item' });
            }
            res.json({
                id: this.lastID,
                type,
                color,
                occasions: occasionsArray,
                imagePath
            });
        }
    );
});

// Delete wardrobe item
app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;

    // First get the image path
    db.get('SELECT image_path FROM wardrobe_items WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error finding item:', err);
            return res.status(500).json({ error: 'Failed to find item' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Delete the image file
        const imagePath = path.join(__dirname, '..', 'public', row.image_path);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Delete from database
        db.run('DELETE FROM wardrobe_items WHERE id = ?', [id], (err) => {
            if (err) {
                console.error('Error deleting item:', err);
                return res.status(500).json({ error: 'Failed to delete item' });
            }
            res.json({ success: true });
        });
    });
});

// Get outfit suggestions
app.get('/api/suggestions', (req, res) => {
    const { occasion } = req.query;

    if (!occasion) {
        return res.status(400).json({ error: 'Occasion is required' });
    }

    // Get all items for the occasion
    db.all('SELECT * FROM wardrobe_items', (err, rows) => {
        if (err) {
            console.error('Error fetching items:', err);
            return res.status(500).json({ error: 'Failed to fetch items' });
        }

        const items = rows.map(row => ({
            ...row,
            occasions: JSON.parse(row.occasions),
            imagePath: row.image_path
        })).filter(item => item.occasions.includes(occasion));

        if (items.length === 0) {
            return res.status(404).json({ 
                message: 'No items found for this occasion. Try adding more items to your wardrobe!' 
            });
        }

        // Try to find matching sets
        const suggestion = findMatchingSet(items, occasion);
        res.json(suggestion);
    });
});

// Helper function to find matching sets
function findMatchingSet(items, occasion) {
    // Try to find a saree and blouse set
    const saree = items.find(item => item.type === 'Saree');
    const blouse = items.find(item => item.type === 'Blouse');
    if (saree && blouse) {
        return { saree, blouse };
    }

    // Try to find a lehenga and choli set
    const lehenga = items.find(item => item.type === 'Lehenga');
    const choli = items.find(item => item.type === 'Choli');
    if (lehenga && choli) {
        return { lehenga, choli };
    }

    // Try to find a top and bottom set
    const top = items.find(item => ['T-Shirt', 'Kurta', 'Kurti'].includes(item.type));
    const bottom = items.find(item => ['Jeans', 'Trousers', 'Salwar'].includes(item.type));
    if (top && bottom) {
        return { top, bottom };
    }

    // If no complete set found, return the first item
    return { message: 'No complete outfit found. Here are some individual items you might like:' };
}

// Initialize database with demo items
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            color TEXT NOT NULL,
            occasions TEXT NOT NULL,
            imagePath TEXT NOT NULL
        )
    `);

    // Check if items table is empty
    db.get("SELECT COUNT(*) as count FROM items", (err, row) => {
        if (err) {
            console.error('Error checking items table:', err);
            return;
        }

        if (row.count === 0) {
            console.log('Downloading demo images...');
            const demoItems = [
                {
                    type: 'Saree',
                    color: 'Red',
                    occasions: JSON.stringify(['Wedding Function', 'Festival', 'Puja/Religious']),
                    imagePath: 'images/saree1.jpg'
                },
                {
                    type: 'Blouse',
                    color: 'Gold',
                    occasions: JSON.stringify(['Wedding Function', 'Puja/Religious']),
                    imagePath: 'images/blouse1.jpg'
                },
                {
                    type: 'Lehenga',
                    color: 'Pink',
                    occasions: JSON.stringify(['Wedding Function', 'Festival']),
                    imagePath: 'images/lehenga1.jpg'
                },
                {
                    type: 'Choli',
                    color: 'Green',
                    occasions: JSON.stringify(['Wedding Function', 'Festival']),
                    imagePath: 'images/choli1.jpg'
                },
                {
                    type: 'Kurta',
                    color: 'Blue',
                    occasions: JSON.stringify(['Casual', 'Family Gathering']),
                    imagePath: 'images/kurta1.jpg'
                },
                {
                    type: 'Salwar',
                    color: 'Black',
                    occasions: JSON.stringify(['Casual', 'Work']),
                    imagePath: 'images/salwar1.jpg'
                },
                {
                    type: 'Kurti',
                    color: 'Yellow',
                    occasions: JSON.stringify(['Casual', 'Work']),
                    imagePath: 'images/kurti1.jpg'
                },
                {
                    type: 'Dupatta',
                    color: 'White',
                    occasions: JSON.stringify(['Wedding Function', 'Festival']),
                    imagePath: 'images/dupatta1.jpg'
                },
                {
                    type: 'Sherwani',
                    color: 'Maroon',
                    occasions: JSON.stringify(['Wedding Function']),
                    imagePath: 'images/sherwani1.jpg'
                },
                {
                    type: 'Churidar',
                    color: 'Black',
                    occasions: JSON.stringify(['Wedding Function', 'Festival']),
                    imagePath: 'images/churidar1.jpg'
                }
            ];

            const stmt = db.prepare("INSERT INTO items (type, color, occasions, imagePath) VALUES (?, ?, ?, ?)");
            demoItems.forEach(item => {
                stmt.run(item.type, item.color, item.occasions, item.imagePath);
            });
            stmt.finalize();
        }
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is in use, trying port ${PORT + 1}`);
        app.listen(PORT + 1, () => {
            console.log(`Server running on http://localhost:${PORT + 1}`);
        });
    } else {
        console.error('Server error:', err);
    }
}); 