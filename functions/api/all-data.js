export async function onRequestGet(context) {
    const { searchParams } = new URL(context.request.url);
    const kec = searchParams.get('kec');
    const desa = searchParams.get('desa');
    const db = context.env.DB;

    // UPDATE: Gunakan LEFT JOIN agar data tidak hilang jika kode wilayah bermasalah
    let query = `
        SELECT p.*, d.nama_desa, k.nama_kecamatan 
        FROM pengurus p
        LEFT JOIN desa d ON p.kode_desa_lengkap = d.kode_desa_lengkap
        LEFT JOIN kecamatan k ON d.kode_kec = k.kode_kec
        WHERE 1=1
    `;

    const params = [];
    if (kec) { query += " AND k.kode_kec = ?"; params.push(kec); }
    if (desa) { query += " AND p.kode_desa_lengkap = ?"; params.push(desa); }

    query += " ORDER BY p.created_at DESC";

    const { results } = await db.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
    });
}
