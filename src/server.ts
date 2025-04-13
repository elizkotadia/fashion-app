import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { WardrobeItem, Occasion, ItemType, ItemCategory, OutfitSuggestion, categorizeItem } from './types';

const app = express();
const port = 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// In-memory storage for wardrobe items
let wardrobeItems: WardrobeItem[] = [];

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Endpoints
app.post('/api/items', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const { type, color, occasions } = req.body;
  
  if (!type || !color || !occasions) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newItem: WardrobeItem = {
    id: uuidv4(),
    type: type as ItemType,
    category: categorizeItem(type as ItemType),
    color,
    occasions: JSON.parse(occasions) as Occasion[],
    imagePath: `/uploads/${req.file.filename}`
  };

  wardrobeItems.push(newItem);
  res.status(201).json(newItem);
});

app.get('/api/items', (req, res) => {
  res.json(wardrobeItems);
});

app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  wardrobeItems = wardrobeItems.filter(item => item.id !== id);
  res.status(204).send();
});

app.put('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const { type, color, occasions } = req.body;
  
  const itemIndex = wardrobeItems.findIndex(item => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  wardrobeItems[itemIndex] = {
    ...wardrobeItems[itemIndex],
    type: type || wardrobeItems[itemIndex].type,
    category: type ? categorizeItem(type as ItemType) : wardrobeItems[itemIndex].category,
    color: color || wardrobeItems[itemIndex].color,
    occasions: occasions ? JSON.parse(occasions) as Occasion[] : wardrobeItems[itemIndex].occasions
  };

  res.json(wardrobeItems[itemIndex]);
});

app.get('/api/suggestions', (req, res) => {
  const { occasion } = req.query;
  
  if (!occasion) {
    return res.status(400).json({ error: 'Occasion parameter is required' });
  }

  const matchingItems = wardrobeItems.filter(item => 
    item.occasions.includes(occasion as Occasion)
  );

  const suggestion: OutfitSuggestion = {};

  switch (occasion) {
    case 'Festival':
    case 'Wedding Function': {
      // Try to find ethnic combinations first
      const saree = matchingItems.find(item => item.type === 'Saree');
      const blouse = matchingItems.find(item => item.type === 'Blouse');
      const lehenga = matchingItems.find(item => item.type === 'Lehenga');
      const choli = matchingItems.find(item => item.type === 'Choli');
      const kurta = matchingItems.find(item => item.type === 'Kurta');
      const sherwani = matchingItems.find(item => item.type === 'Sherwani');
      const ethnicBottom1 = matchingItems.find(item => 
        ['Pajama', 'Churidar', 'Dhoti'].includes(item.type)
      );
      const dupatta = matchingItems.find(item => item.type === 'Dupatta');

      if (saree && blouse) {
        suggestion.saree = saree;
        suggestion.blouse = blouse;
        if (dupatta) suggestion.dupatta = dupatta;
      } else if (lehenga && choli) {
        suggestion.lehenga = lehenga;
        suggestion.choli = choli;
        if (dupatta) suggestion.dupatta = dupatta;
      } else if ((kurta || sherwani) && ethnicBottom1) {
        suggestion.top = kurta || sherwani;
        suggestion.bottom = ethnicBottom1;
        if (dupatta) suggestion.dupatta = dupatta;
      }
      break;
    }

    case 'Puja/Religious': {
      const religiousKurta = matchingItems.find(item => item.type === 'Kurta');
      const religiousBottom = matchingItems.find(item => 
        ['Pajama', 'Churidar', 'Dhoti', 'Salwar'].includes(item.type)
      );
      const religiousSaree = matchingItems.find(item => item.type === 'Saree');
      const religiousBlouse = matchingItems.find(item => item.type === 'Blouse');

      if (religiousKurta && religiousBottom) {
        suggestion.top = religiousKurta;
        suggestion.bottom = religiousBottom;
      } else if (religiousSaree && religiousBlouse) {
        suggestion.saree = religiousSaree;
        suggestion.blouse = religiousBlouse;
      }
      break;
    }

    case 'Family Gathering': {
      const casualKurti = matchingItems.find(item => item.type === 'Kurti');
      const casualBottom = matchingItems.find(item => 
        ['Jeans', 'Trousers', 'Leggings'].includes(item.type)
      );
      const casualKurta = matchingItems.find(item => item.type === 'Kurta');
      const ethnicBottom2 = matchingItems.find(item => 
        ['Pajama', 'Churidar'].includes(item.type)
      );

      if (casualKurti && casualBottom) {
        suggestion.top = casualKurti;
        suggestion.bottom = casualBottom;
      } else if (casualKurta && ethnicBottom2) {
        suggestion.top = casualKurta;
        suggestion.bottom = ethnicBottom2;
      }
      break;
    }

    case 'Work': {
      const formalShirt = matchingItems.find(item => item.type === 'Shirt');
      const formalTrousers = matchingItems.find(item => item.type === 'Trousers');
      const formalKurti = matchingItems.find(item => 
        item.type === 'Kurti' && item.occasions.includes('Work')
      );

      if (formalShirt && formalTrousers) {
        suggestion.top = formalShirt;
        suggestion.bottom = formalTrousers;
      } else if (formalKurti && formalTrousers) {
        suggestion.top = formalKurti;
        suggestion.bottom = formalTrousers;
      }
      break;
    }

    case 'Casual': {
      const tshirt = matchingItems.find(item => item.type === 'T-Shirt');
      const jeans = matchingItems.find(item => item.type === 'Jeans');
      const casualDress = matchingItems.find(item => 
        item.type === 'Dress' && item.occasions.includes('Casual')
      );

      if (tshirt && jeans) {
        suggestion.top = tshirt;
        suggestion.bottom = jeans;
      } else if (casualDress) {
        suggestion.top = casualDress;
      }
      break;
    }
  }

  // If no suggestion was found, return an error
  if (Object.keys(suggestion).length === 0) {
    return res.status(404).json({ 
      error: 'No matching outfit found',
      message: 'Try adding more items to your wardrobe that match this occasion.'
    });
  }

  res.json(suggestion);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 