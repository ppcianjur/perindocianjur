import { sha1 } from '../utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        // 1. Ambil Settings
        const config = await env.DB.prepare("SELECT * FROM settings").all();
        const settings = Object.fromEntries(config.results.map(r => [r.key_name, r.key_value]));

        // 2. Upload Cloudinary
        const timestamp = Math.round(new Date().getTime() / 1000).toString();
        const publicId = `person_${Date.now()}`;
        const paramsToSign = `format=webp&public_id=${publicId}&timestamp=${timestamp}${settings.CLOUDINARY_API_SECRET}`;
        const signature = await sha1(paramsToSign);

        const cloudiFormData = new FormData();
        cloudiFormData.append('file', file);
        cloudiFormData.append('api_key', settings.CLOUDINARY_API_KEY);
        cloudiFormData.append('timestamp', timestamp);
        cloudiFormData.append('public_id', publicId);
        cloudiFormData.append('format', 'webp');
        cloudiFormData.append('signature', signature);

        const cloudiRes = await fetch(`https://api.cloudinary.com/v1_1/${settings.CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST', body: cloudiFormData
        });
        const cloudiJson = await cloudiRes.json();

        if (cloudiJson.error) throw new Error(cloudiJson.error.message);

        return new Response(JSON.stringify({ success: true, url: cloudiJson.secure_url }));

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
