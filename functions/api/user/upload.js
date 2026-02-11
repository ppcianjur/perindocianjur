export async function onRequestPost(context) {
  const { imageBase64, userId } = await context.request.json();
  
  // 1. Upload ke Cloudinary
  const cloudiRes = await fetch(`https://api.cloudinary.com/v1_1/${context.env.CLOUDI_NAME}/image/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: `data:image/jpeg;base64,${imageBase64}`,
      upload_preset: context.env.CLOUDI_PRESET
    })
  });
  const cloudiData = await cloudiRes.json();

  // 2. OCR dengan Gemini 1.5 Flash
  const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${context.env.GEMINI_KEY}`, {
    method: 'POST',
    body: JSON.stringify({
      contents: [{ parts: [
        { text: "Ekstrak data KTP ini ke JSON: nik, nama, alamat, kode_kec (6 digit kemendagri), nama_desa. HANYA JSON." },
        { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
      ]}]
    })
  });
  
  const geminiData = await geminiRes.json();
  const ktpResult = JSON.parse(geminiData.candidates[0].content.parts[0].text);

  // 3. Simpan ke D1
  await context.env.DB.prepare(
    "INSERT INTO pengurus (nik, nama, foto_url, kode_desa) VALUES (?, ?, ?, ?)"
  ).bind(ktpResult.nik, ktpResult.nama, cloudiData.secure_url, ktpResult.kode_desa).run();

  return new Response(JSON.stringify({ success: true, data: ktpResult }));
}
