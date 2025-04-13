export type ItemType = 
  | 'Shirt' | 'T-Shirt' | 'Jeans' | 'Trousers' | 'Dress' | 'Skirt'
  | 'Kurta' | 'Kurti' | 'Saree' | 'Blouse' | 'Lehenga' | 'Choli'
  | 'Sherwani' | 'Pajama' | 'Churidar' | 'Dhoti' | 'Salwar' | 'Kameez' | 'Dupatta';

export type Occasion = 
  | 'Casual' | 'Work' | 'Family Gathering' | 'Puja/Religious' | 'Festival' | 'Wedding Function';

export type ItemCategory = 
  | 'Ethnic Top' | 'Ethnic Bottom' | 'Saree Set' | 'Lehenga Set' 
  | 'Western Top' | 'Western Bottom' | 'Dress' | 'Accessory';

export interface WardrobeItem {
  id: string;
  type: ItemType;
  category: ItemCategory;
  color: string;
  occasions: Occasion[];
  imagePath: string;
}

export interface OutfitSuggestion {
  top?: WardrobeItem;
  bottom?: WardrobeItem;
  saree?: WardrobeItem;
  blouse?: WardrobeItem;
  lehenga?: WardrobeItem;
  choli?: WardrobeItem;
  dupatta?: WardrobeItem;
  message?: string;
}

// Helper function to categorize items
export function categorizeItem(type: ItemType): ItemCategory {
  switch (type) {
    case 'Kurta':
    case 'Kurti':
    case 'Sherwani':
    case 'Kameez':
      return 'Ethnic Top';
    case 'Pajama':
    case 'Churidar':
    case 'Dhoti':
    case 'Salwar':
      return 'Ethnic Bottom';
    case 'Saree':
      return 'Saree Set';
    case 'Lehenga':
      return 'Lehenga Set';
    case 'Blouse':
    case 'Choli':
      return 'Accessory';
    case 'Shirt':
    case 'T-Shirt':
      return 'Western Top';
    case 'Jeans':
    case 'Trousers':
    case 'Skirt':
      return 'Western Bottom';
    case 'Dress':
      return 'Dress';
    case 'Dupatta':
      return 'Accessory';
    default:
      return 'Western Top';
  }
} 