import { sha1, extractKTPData } from '../utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const formData = await request.formData();
        const imageFile = formData.get('foto');
        const base64Data = formData.get('base64');
        const creator = formData.get('creator');

        // 1. Ambil Settings
        const config = await env.DB.prepare("SELECT * FROM settings").all();
        const settings = Object.fromEntries(config.results.map(r => [r.key_name, r.key_value]));

        // 2. Upload Cloudinary
        const timestamp = Math.round(new Date().getTime() / 1000).toString();
        const publicId = `ktp_${Date.now()}`;
        const paramsToSign = `format=webp&public_id=${publicId}&timestamp=${timestamp}${settings.CLOUDINARY_API_SECRET}`;
        const signature = await sha1(paramsToSign);

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
        
        if (cloudiJson.error) throw new Error("Cloudinary Error: " + cloudiJson.error.message);

        // 3. Gemini OCR
        const ktp = await extractKTPData(base64Data, env.DB);

        // PENTING: Kembalikan foto_url agar bisa disimpan di tahap kedua
        return new Response(JSON.stringify({ 
            success: true, 
            data: ktp,
            foto_url: cloudiJson.secure_url 
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
