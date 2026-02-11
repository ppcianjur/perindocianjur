export async function onRequestGet(context) {
    const { searchParams } = new URL(context.request.url);
    const username = searchParams.get('user');
    
    // PERBAIKAN: Tambahkan JOIN ke tabel kecamatan & ambil nama_kecamatan
    const { results } = await context.env.DB.prepare(`
        SELECT p.*, d.nama_desa, k.nama_kecamatan
        FROM pengurus p
        LEFT JOIN desa d ON p.kode_desa_lengkap = d.kode_desa_lengkap
        LEFT JOIN kecamatan k ON d.kode_kec = k.kode_kec
        WHERE p.creator = ?
        ORDER BY p.created_at DESC
    `).bind(username).all();

    return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
    });
}
