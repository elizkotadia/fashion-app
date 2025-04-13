const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const https = require('https');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create images directory if it doesn't exist
const imageDir = path.join(__dirname, '..', '..', 'public', 'images', 'demo');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

const db = new sqlite3.Database(path.join(dbDir, 'wardrobe.db'));

// Function to download image from thispersondoesnotexist.com
async function downloadImage(filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, '..', '..', 'public', 'images', 'demo', filename);
        const file = fs.createWriteStream(filePath);

        https.get('https://thispersondoesnotexist.com/', response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', err => {
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
}

// Initialize database with schema
db.serialize(async () => {

    // db.run(`
    //     DROP TABLE IF EXISTS wardrobe_items;
    // `);
    // Create table
    db.run(`
        CREATE TABLE IF NOT EXISTS wardrobe_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            color TEXT NOT NULL,
            occasions TEXT NOT NULL,
            image_path TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Check if we already have demo data
    db.get("SELECT COUNT(*) as count FROM wardrobe_items", async (err, row) => {
        if (err) {
            console.error('Error checking for demo data:', err);
            return;
        }

        if (row.count === 0) {
            // Insert demo data
            const demoItems = [
                {
                    type: 'Saree',
                    color: 'Red',
                    occasions: JSON.stringify(['Wedding Function', 'Festival', 'Puja/Religious']),
                    image_path: 'images/demo/saree1.jpg'
                },
                {
                    type: 'Blouse',
                    color: 'Gold',
                    occasions: JSON.stringify(['Wedding Function', 'Festival', 'Puja/Religious']),
                    image_path: 'images/demo/blouse1.jpg'
                },
                {
                    type: 'Lehenga',
                    color: 'Pink',
                    occasions: JSON.stringify(['Wedding Function', 'Festival']),
                    image_path: 'images/demo/lehenga1.jpg'
                },
                {
                    type: 'Choli',
                    color: 'Silver',
                    occasions: JSON.stringify(['Wedding Function', 'Festival']),
                    image_path: 'images/demo/choli1.jpg'
                },
                {
                    type: 'Kurta',
                    color: 'Blue',
                    occasions: JSON.stringify(['Casual', 'Work', 'Family Gathering']),
                    image_path: 'images/demo/kurta1.jpg'
                },
                {
                    type: 'Salwar',
                    color: 'Black',
                    occasions: JSON.stringify(['Casual', 'Work', 'Family Gathering']),
                    image_path: 'images/demo/salwar1.jpg'
                },
                {
                    type: 'Kurti',
                    color: 'White',
                    occasions: JSON.stringify(['Casual', 'Work']),
                    image_path: 'images/demo/kurti1.jpg'
                },
                {
                    type: 'Dupatta',
                    color: 'Green',
                    occasions: JSON.stringify(['Casual', 'Work', 'Family Gathering']),
                    image_path: 'images/demo/dupatta1.jpg'
                },
                {
                    type: 'Sherwani',
                    color: 'Maroon',
                    occasions: JSON.stringify(['Wedding Function', 'Festival']),
                    image_path: 'images/demo/sherwani1.jpg'
                },
                {
                    type: 'Churidar',
                    color: 'Navy',
                    occasions: JSON.stringify(['Casual', 'Work', 'Family Gathering']),
                    image_path: 'images/demo/churidar1.jpg'
                }
            ];

            // Download images first
            console.log('Downloading demo images...');
            for (const item of demoItems) {
                const filename = path.basename(item.image_path);
                try {
                    await downloadImage(filename);
                    console.log(`Downloaded ${filename}`);
                } catch (error) {
                    console.error(`Failed to download ${filename}:`, error);
                }
            }

            const stmt = db.prepare(`
                INSERT INTO wardrobe_items (type, color, occasions, image_path)
                VALUES (?, ?, ?, ?)
            `);

            demoItems.forEach(item => {
                stmt.run(item.type, item.color, item.occasions, item.image_path);
            });

            stmt.finalize();
            console.log('Demo data inserted successfully');
       }
    });
});

module.exports = db; 