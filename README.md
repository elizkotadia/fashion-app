# Digital Wardrobe & Outfit Suggester

A web application that helps you manage your wardrobe and get outfit suggestions based on occasions.

## Features

- Add clothing items with details (type, color, occasions)
- View your wardrobe in a gallery layout
- Get outfit suggestions based on selected occasions
- Image upload support for clothing items

## Tech Stack

- Backend: Node.js, Express.js, TypeScript
- Frontend: HTML, Tailwind CSS, Vanilla JavaScript
- File Upload: Multer

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
fashion-app/
├── src/
│   ├── server.ts         # Express server and API endpoints
│   └── types.ts          # TypeScript interfaces
├── public/
│   ├── index.html        # Main HTML file
│   ├── style.css         # Custom CSS styles
│   ├── script.js         # Frontend JavaScript
│   └── uploads/          # Directory for uploaded images
├── package.json          # Project dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## API Endpoints

- `POST /api/items`: Add a new clothing item
- `GET /api/items`: Get all clothing items
- `GET /api/suggestions`: Get outfit suggestions based on occasion

## Usage

1. Add Items:
   - Fill out the form with item details
   - Upload an image
   - Select applicable occasions
   - Click "Add Item"

2. View Wardrobe:
   - Your added items will be displayed in a grid layout
   - Each item shows its image, type, color, and occasions

3. Get Suggestions:
   - Select an occasion from the dropdown
   - Click "Suggest Outfit"
   - View the suggested top and bottom combination 