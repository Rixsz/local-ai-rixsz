/**
 * imageGenerator.js - Specialized Multimodal Service
 * Handles API handshakes for Stable Diffusion and Google Imagen
 */

const ImageGenerator = {
    async generate(prompt) {
        console.log(`🎨 Initiating generation for: "${prompt}"`);
        
        try {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                return {
                    success: true,
                    image: `data:image/png;base64,${data.image}`,
                    prompt: prompt
                };
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("🖼️ Image Service Error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    createImageNode(imageData) {
        const container = document.createElement('div');
        container.className = 'generated-image-container';
        
        const img = document.createElement('img');
        img.src = imageData.image;
        img.alt = imageData.prompt;
        img.className = 'generated-image';
        
        const download = document.createElement('a');
        download.href = imageData.image;
        download.download = `art_${Date.now()}.png`;
        download.className = 'download-link';
        download.textContent = '💾 Download High-IQ Art';
        
        container.appendChild(img);
        container.appendChild(download);
        return container;
    }
};

window.ImageGenerator = ImageGenerator;
