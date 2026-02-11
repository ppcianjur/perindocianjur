import { sha1, extractKTPData } from '../utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        console.log("--- START DEBUG UPLOAD ---");
        
        // 1. Cek Body
        const formData = await request.formData();
        const imageFile = formData.get('foto');
        const base64Data = formData.get('base64');
        const creator = formData.get('creator');

        console.log("Input Check:", { 
            hasFile: !!imageFile, 
            base64Length: base64Data?.length, 
            creator 
        });

        // 2. Ambil Settings dari D1
        console.log("Fetching settings from D1...");
        const config = await env.DB.prepare("SELECT * FROM settings").all();
        if (!config.results || config.results.length === 0) {
            throw new Error("Tabel settings kosong atau tidak ditemukan di D1!");
        }
        const settings = Object.fromEntries(config.results.map(r => [r.key_name, r.key_value]));
        console.log("Settings Loaded for Cloudinary:", settings.CLOUDINARY_CLOUD_NAME);

        // 3. Cloudinary Upload
        const timestamp = Math.round(new Date().getTime() / 1000).toString();
        const publicId = `ktp_${Date.now()}`;
        const paramsToSign = `format=webp&public_id=${publicId}&timestamp=${timestamp}${settings.CLOUDINARY_API_SECRET}`;
        const signature = await sha1(paramsToSign);

        console.log("Uploading to Cloudinary...");
        const cloudiFormData = new FormData();
        cloudiFormData.append('file', imageFile);
        cloudiFormData.append('api_key', settings.CLOUDINARY_API_KEY);
        cloudiFormData.append('timestamp', timestamp);
        cloudiFormData.append('public_id', publicId);
        cloudiFormData.append('format', 'webp');
        cloudiFormData.append('signature', signature);

        const cloudiRes = await fetch(`https://api.cloudinary.com/v1_1/${settings.CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST', body: cloudiFormData
        });
        const cloudiJson = await cloudiRes.json();
        
        if (cloudiJson.error) {
            console.error("Cloudinary Error:", cloudiJson.error);
            throw new Error("Cloudinary: " + cloudiJson.error.message);
        }
        console.log("Cloudinary Success:", cloudiJson.secure_url);

        // 4. Gemini OCR
        console.log("Calling Gemini AI...");
        const ktp = await extractKTPData(base64Data, env.DB);
        console.log("Gemini Success! Extracted Name:", ktp.nama);

        return new Response(JSON.stringify({ success: true, data: ktp }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error("FATAL ERROR:", err.message);
        return new Response(JSON.stringify({ 
            success: false, 
            error: err.message,
            stack: err.stack 
        }), { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
}
