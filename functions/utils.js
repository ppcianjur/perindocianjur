// functions/utils.js

export async function sha1(str) {
    const buffer = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buffer);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function extractKTPData(base64Image, db) {
    // Ambil API KEY dari tabel settings
    const setting = await db.prepare("SELECT key_value FROM settings WHERE key_name = 'GEMINI_API_KEY'").first();
    const apiKey = setting?.key_value;

    if (!apiKey) throw new Error("GEMINI_API_KEY tidak ditemukan di database!");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const strictPrompt = `Anda adalah asisten OCR khusus untuk KTP Indonesia. Tugas Anda adalah mengekstrak data dari gambar KTP secara akurat.

Ekstrak: NIK (16 digit), Nama, Tempat Lahir, Tanggal Lahir, Alamat, RT, RW, Kelurahan, Kecamatan.
Format Tanggal harus: DD-MM-YYYY.
Jika ada teks yang buram, tulis 'TIDAK TERBACA'.
HANYA berikan output dalam format JSON mentah tanpa penjelasan atau markdown seperti ini:
{"nik": "...", "nama": "...", "tempat_lahir": "...", "tanggal_lahir": "...", "alamat": "...", "rt": "...", "rw": "...", "kelurahan": "...", "kecamatan": "..."}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: strictPrompt },
                    { inline_data: { mime_type: "image/jpeg", data: base64Image } }
                ]
            }]
        })
    });

    const result = await response.json();
    
    if (!result.candidates || result.candidates.length === 0) {
        throw new Error("Gemini tidak memberikan respon. Periksa kuota API Key.");
    }

    const textResponse = result.candidates[0].content.parts[0].text;
    
    try {
        const cleanJson = textResponse.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        throw new Error("Gagal parsing JSON AI. Coba foto lebih jelas.");
    }
}
