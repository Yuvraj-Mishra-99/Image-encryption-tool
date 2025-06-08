class ImageEncryptionTool {
    constructor() {
        this.originalImage = null;
        this.originalImageData = null;
        this.processedImageData = null;
        this.currentMethod = null;
        this.currentKey = null;
        
        this.initializeElements();
        this.bindEvents();
        this.updateUI();
    }

    initializeElements() {
        // DOM elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.imageDimensions = document.getElementById('imageDimensions');
        
        this.originalCanvas = document.getElementById('originalCanvas');
        this.resultCanvas = document.getElementById('resultCanvas');
        this.originalCtx = this.originalCanvas.getContext('2d');
        this.resultCtx = this.resultCanvas.getContext('2d');
        
        this.originalStatus = document.getElementById('originalStatus');
        this.resultStatus = document.getElementById('resultStatus');
        
        this.encryptionMethod = document.getElementById('encryptionMethod');
        this.encryptionKey = document.getElementById('encryptionKey');
        this.keyLabel = document.getElementById('keyLabel');
        this.keyDescription = document.getElementById('keyDescription');
        
        this.encryptBtn = document.getElementById('encryptBtn');
        this.decryptBtn = document.getElementById('decryptBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyKeyBtn = document.getElementById('copyKeyBtn');
        
        this.statusMessages = document.getElementById('statusMessages');
    }

    bindEvents() {
        // File upload events - Fixed event binding
        this.uploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            this.fileInput.click();
        });
        
        this.uploadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e);
            }
        });
        
        // Drag and drop events
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Control events
        this.encryptionMethod.addEventListener('change', () => this.updateKeyInput());
        this.encryptionKey.addEventListener('input', () => this.validateInput());
        
        this.encryptBtn.addEventListener('click', () => this.encrypt());
        this.decryptBtn.addEventListener('click', () => this.decrypt());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.downloadBtn.addEventListener('click', () => this.downloadResult());
        this.copyKeyBtn.addEventListener('click', () => this.copyKey());
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        // Validate file type
        const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
        if (!supportedTypes.includes(file.type)) {
            this.showMessage('Please select a valid image file (PNG, JPG, JPEG, or GIF)', 'error');
            return;
        }

        // Validate file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showMessage('File is too large. Please select an image smaller than 10MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayOriginalImage();
                this.updateFileInfo(file, img);
                this.updateUI();
                this.showMessage('Image loaded successfully', 'success');
            };
            img.onerror = () => {
                this.showMessage('Failed to load image', 'error');
            };
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            this.showMessage('Failed to read file', 'error');
        };
        
        reader.readAsDataURL(file);
    }

    displayOriginalImage() {
        const maxWidth = 400;
        const maxHeight = 300;
        const { width, height } = this.calculateDimensions(
            this.originalImage.width, 
            this.originalImage.height, 
            maxWidth, 
            maxHeight
        );

        this.originalCanvas.width = width;
        this.originalCanvas.height = height;
        
        this.originalCtx.clearRect(0, 0, width, height);
        this.originalCtx.drawImage(this.originalImage, 0, 0, width, height);
        
        // Store original image data
        this.originalImageData = this.originalCtx.getImageData(0, 0, width, height);
        
        this.originalStatus.textContent = `${width} × ${height} pixels`;
    }

    calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        const aspectRatio = originalWidth / originalHeight;
        
        let width = originalWidth;
        let height = originalHeight;
        
        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        return { width: Math.round(width), height: Math.round(height) };
    }

    updateFileInfo(file, img) {
        this.fileName.textContent = file.name;
        this.imageDimensions.textContent = `${img.width} × ${img.height}`;
        this.fileInfo.classList.remove('hidden');
    }

    updateKeyInput() {
        const method = this.encryptionMethod.value;
        const keyConfigs = {
            xor: { label: 'XOR Key (0-255)', type: 'number', description: 'Numeric key for XOR operation on pixel values' },
            swap: { label: 'Seed Value', type: 'text', description: 'Text seed for reproducible pixel shuffling' },
            caesar: { label: 'Shift Value (0-255)', type: 'number', description: 'Amount to shift each pixel value' },
            math: { label: 'Math Key (1-255)', type: 'number', description: 'Key for mathematical operations on pixels' }
        };

        if (keyConfigs[method]) {
            const config = keyConfigs[method];
            this.keyLabel.textContent = config.label;
            this.encryptionKey.type = config.type;
            this.keyDescription.textContent = config.description;
            this.encryptionKey.value = ''; // Clear previous value when switching methods
        } else {
            this.keyLabel.textContent = 'Encryption Key';
            this.keyDescription.textContent = 'Select an encryption method first';
        }
        
        this.validateInput();
    }

    validateInput() {
        const method = this.encryptionMethod.value;
        const key = this.encryptionKey.value.trim();
        
        let isValid = false;
        
        if (method && key && this.originalImage) {
            switch (method) {
                case 'xor':
                case 'caesar':
                    isValid = /^\d+$/.test(key) && parseInt(key) >= 0 && parseInt(key) <= 255;
                    break;
                case 'math':
                    isValid = /^\d+$/.test(key) && parseInt(key) >= 1 && parseInt(key) <= 255;
                    break;
                case 'swap':
                    isValid = key.length > 0;
                    break;
            }
        }
        
        this.encryptBtn.disabled = !isValid;
        this.decryptBtn.disabled = !isValid;
        this.copyKeyBtn.disabled = !key;
    }

    async encrypt() {
        if (!this.originalImageData || !this.encryptionMethod.value || !this.encryptionKey.value) {
            this.showMessage('Please load an image and select encryption parameters', 'error');
            return;
        }

        this.setLoadingState(this.encryptBtn, true);
        
        try {
            const method = this.encryptionMethod.value;
            const key = this.encryptionKey.value.trim();
            
            // Clone original image data
            const imageData = new ImageData(
                new Uint8ClampedArray(this.originalImageData.data),
                this.originalImageData.width,
                this.originalImageData.height
            );
            
            // Apply encryption
            await this.applyEncryption(imageData, method, key);
            
            // Display result
            this.displayResult(imageData);
            this.resultStatus.textContent = `Encrypted with ${method.toUpperCase()}`;
            
            this.currentMethod = method;
            this.currentKey = key;
            this.processedImageData = imageData;
            
            this.downloadBtn.disabled = false;
            this.showMessage('Image encrypted successfully', 'success');
            
        } catch (error) {
            this.showMessage('Encryption failed: ' + error.message, 'error');
        } finally {
            this.setLoadingState(this.encryptBtn, false);
        }
    }

    async decrypt() {
        if (!this.originalImageData || !this.encryptionMethod.value || !this.encryptionKey.value) {
            this.showMessage('Please load an image and select decryption parameters', 'error');
            return;
        }

        this.setLoadingState(this.decryptBtn, true);
        
        try {
            const method = this.encryptionMethod.value;
            const key = this.encryptionKey.value.trim();
            
            // Clone original image data
            const imageData = new ImageData(
                new Uint8ClampedArray(this.originalImageData.data),
                this.originalImageData.width,
                this.originalImageData.height
            );
            
            // Apply decryption
            await this.applyDecryption(imageData, method, key);
            
            // Display result
            this.displayResult(imageData);
            this.resultStatus.textContent = `Decrypted with ${method.toUpperCase()}`;
            
            this.processedImageData = imageData;
            this.downloadBtn.disabled = false;
            this.showMessage('Image decrypted successfully', 'success');
            
        } catch (error) {
            this.showMessage('Decryption failed: ' + error.message, 'error');
        } finally {
            this.setLoadingState(this.decryptBtn, false);
        }
    }

    async applyEncryption(imageData, method, key) {
        return new Promise((resolve) => {
            setTimeout(() => {
                switch (method) {
                    case 'xor':
                        this.xorOperation(imageData, parseInt(key));
                        break;
                    case 'swap':
                        this.pixelSwapping(imageData, key, false);
                        break;
                    case 'caesar':
                        this.caesarCipher(imageData, parseInt(key), false);
                        break;
                    case 'math':
                        this.mathOperations(imageData, parseInt(key), false);
                        break;
                }
                resolve();
            }, 10);
        });
    }

    async applyDecryption(imageData, method, key) {
        return new Promise((resolve) => {
            setTimeout(() => {
                switch (method) {
                    case 'xor':
                        this.xorOperation(imageData, parseInt(key)); // XOR is reversible
                        break;
                    case 'swap':
                        this.pixelSwapping(imageData, key, true);
                        break;
                    case 'caesar':
                        this.caesarCipher(imageData, parseInt(key), true);
                        break;
                    case 'math':
                        this.mathOperations(imageData, parseInt(key), true);
                        break;
                }
                resolve();
            }, 10);
        });
    }

    xorOperation(imageData, key) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] ^= key;     // Red
            data[i + 1] ^= key; // Green
            data[i + 2] ^= key; // Blue
            // Alpha channel unchanged
        }
    }

    pixelSwapping(imageData, seed, reverse = false) {
        const data = imageData.data;
        const pixelCount = data.length / 4;
        
        // Create seeded random number generator
        const rng = this.createSeededRNG(seed);
        
        // Generate shuffle sequence
        const indices = Array.from({ length: pixelCount }, (_, i) => i);
        
        // Fisher-Yates shuffle with seeded random
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        // Create a copy of the data
        const originalData = new Uint8ClampedArray(data);
        
        if (reverse) {
            // Reverse shuffle: put pixels back to original positions
            for (let i = 0; i < pixelCount; i++) {
                const targetIndex = indices[i];
                const sourceIndex = i;
                
                data[targetIndex * 4] = originalData[sourceIndex * 4];
                data[targetIndex * 4 + 1] = originalData[sourceIndex * 4 + 1];
                data[targetIndex * 4 + 2] = originalData[sourceIndex * 4 + 2];
                data[targetIndex * 4 + 3] = originalData[sourceIndex * 4 + 3];
            }
        } else {
            // Forward shuffle: move pixels to shuffled positions
            for (let i = 0; i < pixelCount; i++) {
                const sourceIndex = indices[i];
                const targetIndex = i;
                
                data[targetIndex * 4] = originalData[sourceIndex * 4];
                data[targetIndex * 4 + 1] = originalData[sourceIndex * 4 + 1];
                data[targetIndex * 4 + 2] = originalData[sourceIndex * 4 + 2];
                data[targetIndex * 4 + 3] = originalData[sourceIndex * 4 + 3];
            }
        }
    }

    caesarCipher(imageData, shift, reverse = false) {
        const data = imageData.data;
        const actualShift = reverse ? -shift : shift;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = (data[i] + actualShift + 256) % 256;         // Red
            data[i + 1] = (data[i + 1] + actualShift + 256) % 256; // Green
            data[i + 2] = (data[i + 2] + actualShift + 256) % 256; // Blue
            // Alpha channel unchanged
        }
    }

    mathOperations(imageData, key, reverse = false) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            if (reverse) {
                // Reverse operation: subtract and handle underflow
                data[i] = (data[i] - key + 256) % 256;         // Red
                data[i + 1] = (data[i + 1] - key + 256) % 256; // Green
                data[i + 2] = (data[i + 2] - key + 256) % 256; // Blue
            } else {
                // Forward operation: add and handle overflow
                data[i] = (data[i] + key) % 256;         // Red
                data[i + 1] = (data[i + 1] + key) % 256; // Green
                data[i + 2] = (data[i + 2] + key) % 256; // Blue
            }
            // Alpha channel unchanged
        }
    }

    createSeededRNG(seed) {
        // Simple seeded random number generator (Linear Congruential Generator)
        let state = 0;
        for (let i = 0; i < seed.length; i++) {
            state = ((state * 31) + seed.charCodeAt(i)) % 2147483647;
        }
        if (state <= 0) state += 2147483646;
        
        return function() {
            state = (state * 16807) % 2147483647;
            return (state - 1) / 2147483646;
        };
    }

    displayResult(imageData) {
        this.resultCanvas.width = imageData.width;
        this.resultCanvas.height = imageData.height;
        this.resultCtx.putImageData(imageData, 0, 0);
    }

    downloadResult() {
        if (!this.processedImageData) {
            this.showMessage('No processed image to download', 'error');
            return;
        }

        this.resultCanvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `encrypted_image_${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showMessage('Image downloaded successfully', 'success');
            } else {
                this.showMessage('Failed to create download', 'error');
            }
        }, 'image/png');
    }

    copyKey() {
        const key = this.encryptionKey.value.trim();
        if (key) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(key).then(() => {
                    this.showMessage('Key copied to clipboard', 'success');
                }).catch(() => {
                    this.fallbackCopyKey(key);
                });
            } else {
                this.fallbackCopyKey(key);
            }
        }
    }

    fallbackCopyKey(key) {
        // Fallback copy method
        const textArea = document.createElement('textarea');
        textArea.value = key;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showMessage('Key copied to clipboard', 'success');
        } catch (err) {
            this.showMessage('Failed to copy key', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    reset() {
        this.originalImage = null;
        this.originalImageData = null;
        this.processedImageData = null;
        this.currentMethod = null;
        this.currentKey = null;
        
        // Clear canvases
        this.originalCtx.clearRect(0, 0, this.originalCanvas.width, this.originalCanvas.height);
        this.resultCtx.clearRect(0, 0, this.resultCanvas.width, this.resultCanvas.height);
        
        // Reset form
        this.encryptionMethod.value = '';
        this.encryptionKey.value = '';
        this.fileInput.value = '';
        
        // Hide file info
        this.fileInfo.classList.add('hidden');
        
        // Update UI
        this.updateUI();
        this.updateKeyInput();
        
        this.originalStatus.textContent = 'No image loaded';
        this.resultStatus.textContent = 'Awaiting encryption';
        
        this.showMessage('Reset complete', 'info');
    }

    updateUI() {
        const hasImage = !!this.originalImage;
        const hasMethod = !!this.encryptionMethod.value;
        const hasKey = !!this.encryptionKey.value.trim();
        
        this.encryptBtn.disabled = !(hasImage && hasMethod && hasKey);
        this.decryptBtn.disabled = !(hasImage && hasMethod && hasKey);
        this.downloadBtn.disabled = !this.processedImageData;
        this.copyKeyBtn.disabled = !hasKey;
    }

    setLoadingState(button, loading) {
        const textSpan = button.querySelector('.btn-text');
        const spinner = button.querySelector('.loading-spinner');
        
        if (loading) {
            textSpan.classList.add('hidden');
            spinner.classList.remove('hidden');
            button.disabled = true;
        } else {
            textSpan.classList.remove('hidden');
            spinner.classList.add('hidden');
            this.validateInput(); // Re-validate after loading
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message status--${type}`;
        messageDiv.textContent = message;
        
        this.statusMessages.appendChild(messageDiv);
        
        // Trigger animation
        setTimeout(() => messageDiv.classList.add('show'), 10);
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageEncryptionTool();
});