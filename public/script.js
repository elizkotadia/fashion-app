// DOM Elements
const addItemForm = document.getElementById('addItemForm');
const wardrobeGallery = document.getElementById('wardrobe-gallery');
const occasionSelect = document.getElementById('occasionSelect');
const suggestButton = document.getElementById('suggestButton');
const suggestionDisplay = document.getElementById('suggestion-display');
const typeSelect = document.getElementById('type');
const imageInput = document.getElementById('imageInput');
const useCameraBtn = document.getElementById('useCameraBtn');
const uploadImageBtn = document.getElementById('uploadImageBtn');
const cameraPreview = document.getElementById('cameraPreview');
const video = document.getElementById('video');
const captureBtn = document.getElementById('captureBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const imagePreview = document.getElementById('imagePreview');
const preview = document.getElementById('preview');
const submitBtn = document.getElementById('submitBtn');

let stream = null;

// Load wardrobe items on page load
document.addEventListener('DOMContentLoaded', loadWardrobe);

// Form validation
function validateForm() {
    const hasType = typeSelect.value !== '';
    const hasImage = imageInput.files.length > 0 || preview.src !== '';
    submitBtn.disabled = !(hasType && hasImage);
}

typeSelect.addEventListener('change', validateForm);

// Camera functionality
useCameraBtn.addEventListener('click', async () => {
    try {
        // Stop any existing stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        // Hide image preview and show camera
        imagePreview.classList.add('hidden');
        cameraPreview.classList.remove('hidden');
        
        // Start new stream
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        imageInput.value = '';
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Could not access camera. Please check your permissions.');
    }
});

stopCameraBtn.addEventListener('click', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    cameraPreview.classList.add('hidden');
});

captureBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // Convert canvas to blob
    canvas.toBlob(blob => {
        const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        imageInput.files = dataTransfer.files;
        
        // Show preview
        preview.src = URL.createObjectURL(blob);
        imagePreview.classList.remove('hidden');
        cameraPreview.classList.add('hidden');
        
        // Stop camera
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        validateForm();
    }, 'image/jpeg');
});

// Upload image functionality
uploadImageBtn.addEventListener('click', () => {
    // Stop camera if active
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        cameraPreview.classList.add('hidden');
    }
    imageInput.click();
});

imageInput.addEventListener('change', () => {
    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        preview.src = URL.createObjectURL(file);
        imagePreview.classList.remove('hidden');
        cameraPreview.classList.add('hidden');
        validateForm();
    }
});

// Clean up when form is reset
addItemForm.addEventListener('reset', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    cameraPreview.classList.add('hidden');
    imagePreview.classList.add('hidden');
    preview.src = '';
    imageInput.value = '';
    validateForm();
});

// Handle form submission
addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(addItemForm);
    const occasions = Array.from(formData.getAll('occasions'));
    formData.set('occasions', JSON.stringify(occasions));
    
    try {
        const response = await fetch('/api/items', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to add item');
        }
        
        // Reset form and reload wardrobe
        addItemForm.reset();
        loadWardrobe();
        
        // Show success message
        showNotification('Item added successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to add item. Please try again.', 'error');
    }
});

// Load wardrobe items
async function loadWardrobe() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        
        wardrobeGallery.innerHTML = items.map(item => `
            <div class="group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div class="aspect-w-1 aspect-h-1">
                    <img src="${item.imagePath}" alt="${item.type}" class="w-full h-48 object-cover">
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-gray-900">${item.type}</h3>
                    <p class="text-sm text-gray-600">${item.color}</p>
                    <div class="mt-2 flex flex-wrap gap-1">
                        ${item.occasions.map(occasion => `
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                ${occasion}
                            </span>
                        `).join('')}
                    </div>
                </div>
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editItem('${item.id}')" class="p-2 text-gray-600 hover:text-indigo-600 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button onclick="deleteItem('${item.id}')" class="p-2 text-gray-600 hover:text-red-600 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to load wardrobe items.', 'error');
    }
}

// Delete item
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await fetch(`/api/items/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete item');
        }
        
        loadWardrobe();
        showNotification('Item deleted successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to delete item. Please try again.', 'error');
    }
}

// Edit item (placeholder for now)
function editItem(id) {
    // TODO: Implement edit functionality
    showNotification('Edit functionality coming soon!', 'info');
}

// Handle outfit suggestions
suggestButton.addEventListener('click', async () => {
    const occasion = occasionSelect.value;
    
    if (!occasion) {
        showNotification('Please select an occasion', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/suggestions?occasion=${encodeURIComponent(occasion)}`);
        const suggestion = await response.json();
        
        if (response.status === 404) {
            suggestionDisplay.innerHTML = `
                <div class="col-span-full text-center p-6 bg-yellow-50 rounded-xl">
                    <svg class="mx-auto h-12 w-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-yellow-800">No suggestions found</h3>
                    <p class="mt-1 text-sm text-yellow-700">${suggestion.message}</p>
                </div>
            `;
            return;
        }

        let suggestionHTML = '';
        
        // Handle different types of outfit combinations
        if (suggestion.saree && suggestion.blouse) {
            suggestionHTML += createSuggestionCard('Saree', suggestion.saree);
            suggestionHTML += createSuggestionCard('Blouse', suggestion.blouse);
        } else if (suggestion.lehenga && suggestion.choli) {
            suggestionHTML += createSuggestionCard('Lehenga', suggestion.lehenga);
            suggestionHTML += createSuggestionCard('Choli', suggestion.choli);
        } else if (suggestion.top && suggestion.bottom) {
            suggestionHTML += createSuggestionCard('Top', suggestion.top);
            suggestionHTML += createSuggestionCard('Bottom', suggestion.bottom);
        }

        // Add dupatta if present
        if (suggestion.dupatta) {
            suggestionHTML += createSuggestionCard('Dupatta', suggestion.dupatta);
        }

        suggestionDisplay.innerHTML = suggestionHTML;
    } catch (error) {
        console.error('Error:', error);
        showNotification('Failed to get outfit suggestion. Please try again.', 'error');
    }
});

// Helper function to create suggestion cards
function createSuggestionCard(title, item) {
    return `
        <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div class="aspect-w-1 aspect-h-1">
                <img src="${item.imagePath}" alt="${item.type}" class="w-full h-48 object-cover">
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-gray-900">${title}</h3>
                <p class="text-sm text-gray-600">${item.type} - ${item.color}</p>
            </div>
        </div>
    `;
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-y-0 opacity-100 ${
        type === 'success' ? 'bg-green-50 text-green-800' :
        type === 'error' ? 'bg-red-50 text-red-800' :
        type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
        'bg-blue-50 text-blue-800'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${type === 'success' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />' :
                type === 'error' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />' :
                type === 'warning' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />' :
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'}
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateY(-100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
} 