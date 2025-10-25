// TRI BOTS ID - Pastebin Uploader
const fs = require('fs');
const path = require('path');
const PASTEBIN_API_KEY = "EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL"; // Replace with your Pastebin API key

/**
 * Uploads content to Pastebin, handling different input types like text, files, and base64 data.
 * @param {string | Buffer} input - The content to upload, can be text, file path, or base64 data.
 * @param {string} [title] - Optional title for the paste.
 * @param {string} [format] - Optional syntax highlighting format (e.g., 'text', 'python', 'javascript').
 * @param {string} [privacy] - Optional privacy setting (0 = public, 1 = unlisted, 2 = private).
 * @returns {Promise<string>} - The custom URL of the created paste.
 */
async function uploadToPastebin(input, title = 'TRI-BOTS-SESSION', format = 'json', privacy = '1') {
    try {
        // Dynamically import the `pastebin-api` ES module
        const { PasteClient, Publicity } = await import('pastebin-api');

        // Initialize the Pastebin client
        const client = new PasteClient(PASTEBIN_API_KEY);

        // Map privacy settings to `pastebin-api`'s Publicity enum
        const publicityMap = {
            '0': Publicity.Public,
            '1': Publicity.Unlisted,
            '2': Publicity.Private,
        };

        let contentToUpload = '';

        // Detect the type of input and process accordingly
        if (Buffer.isBuffer(input)) {
            // If the input is a Buffer (file content), convert it to string
            contentToUpload = input.toString();
        } else if (typeof input === 'string') {
            if (input.startsWith('data:')) {
                // If the input is a base64 string, extract the actual base64 data
                const base64Data = input.split(',')[1];
                contentToUpload = Buffer.from(base64Data, 'base64').toString();
            } else if (input.startsWith('http://') || input.startsWith('https://')) {
                // If it's a URL, treat it as plain text
                contentToUpload = input;
            } else if (fs.existsSync(input)) {
                // If the input is a file path, read the file (assume it's creds.json in this case)
                contentToUpload = fs.readFileSync(input, 'utf8');
                
                // Add TRI BOTS ID header to the content
                const sessionData = JSON.parse(contentToUpload);
                const enhancedData = {
                    ...sessionData,
                    _metadata: {
                        generatedBy: "TRI BOTS ID",
                        developer: "TRI MSTR DEV STUDIO",
                        timestamp: new Date().toISOString(),
                        version: "1.0.0"
                    }
                };
                contentToUpload = JSON.stringify(enhancedData, null, 2);
            } else {
                // Otherwise, treat it as plain text (code snippet or regular text)
                contentToUpload = input;
            }
        } else {
            throw new Error('Unsupported input type. Please provide text, a file path, or base64 data.');
        }

        // Upload the paste
        const pasteUrl = await client.createPaste({
            code: contentToUpload,
            expireDate: 'N', // Never expire
            format: format, // Syntax highlighting format (set to 'json')
            name: title, // Title of the paste
            publicity: publicityMap[privacy], // Privacy setting
        });

        console.log('🔗 TRI BOTS ID - Original Pastebin URL:', pasteUrl);

        // Manipulate the URL: Remove 'https://pastebin.com/' and prepend TRI BOTS ID prefix
        const pasteId = pasteUrl.replace('https://pastebin.com/', '');
        const customUrl = `TRI-BOTS-ID_${pasteId}`;

        console.log('🚀 TRI BOTS ID - Session ID Generated:', customUrl);
        console.log('📁 TRI BOTS ID - Session Title:', title);
        console.log('⏰ TRI BOTS ID - Upload Time:', new Date().toLocaleString());

        // Return the custom URL
        return customUrl;
    } catch (error) {
        console.error('❌ TRI BOTS ID - Error uploading to Pastebin:', error);
        throw error;
    }
}

module.exports = uploadToPastebin;