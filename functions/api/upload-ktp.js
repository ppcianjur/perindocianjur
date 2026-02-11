import { sha1, extractKTPData } from '../utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const formData = await request.formData();
        const imageFile = formData.get('foto');
        const base64Data = formData.get('base64');
        const noHp = formData.get('no_hp');       // Ambil dari input
        const jabatan = formData.get('jabatan');   // Ambil dari input
        const creator = formData.get('creator');   // Username petugas

        // 1. SIGNED UPLOAD CLOUDINARY
        const timestamp = Math.round(new Date().getTime() / 1000).toString();
        const publicId = `ktp_${Date.now()}`;
        const paramsToSign = `format=webp&public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
        const signature = await sha1(paramsToSign);

        const cloudiFormData = new FormData();
        cloudiFormData.append('file', imageFile);
        cloudiFormData.append('api_key', env.CLOUDINARY_API_KEY);
        cloudiFormData.append('timestamp', timestamp);
        cloudiFormData.append('public_id', publicId);
        cloudiFormData.append('format', 'webp');
        cloudiFormData.append('signature', signature);

        const cloudiRes = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST', body: cloudiFormData
        });
        const cloudiJson = await cloudiRes.json();

        // 2. GEMINI OCR (Minta NIK, Nama, Alamat, Desa)
        const ktp = await extractKTPData(base64Data, env.GEMINI_API_KEY);

        // 3. SIMPAN KE D1 DENGAN NO HP & JABATAN
        const desaRow = await env.DB.prepare("SELECT kode_desa_lengkap FROM desa WHERE nama_desa LIKE ? LIMIT 1")
            .bind(`%${ktp.desa}%`).first();

        await env.DB.prepare(`
            INSERT INTO pengurus (nik, nama, no_hp, jabatan, alamat, kode_desa_lengkap, foto_url, creator) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            ktp.nik, 
            ktp.nama, 
            noHp, 
            jabatan, 
            ktp.alamat, 
            desaRow?.kode_desa_lengkap || null, 
            cloudiJson.secure_url,
            creator
        ).run();

        return new Response(JSON.stringify({ success: true, data: ktp }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
}
