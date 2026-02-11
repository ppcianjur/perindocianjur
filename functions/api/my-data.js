export async function onRequestGet(context) {
    const { searchParams } = new URL(context.request.url);
    const username = searchParams.get('user');
    
    const { results } = await context.env.DB.prepare(`
        SELECT p.*, d.nama_desa 
        FROM pengurus p
        LEFT JOIN desa d ON p.kode_desa_lengkap = d.kode_desa_lengkap
        WHERE p.creator = ?
        ORDER BY p.created_at DESC
    `).bind(username).all();

    return new Response(JSON.stringify(results), {
        headers: { 'Content-Type': 'application/json' }
    });
}
