export async function onRequestGet(context) {
    const { searchParams } = new URL(context.request.url);
    const type = searchParams.get('type');
    const parent = searchParams.get('parent');
    const db = context.env.DB;

    try {
        if (type === 'kecamatan') {
            const { results } = await db.prepare(
                "SELECT kode_kec, nama_kecamatan FROM kecamatan ORDER BY nama_kecamatan ASC"
            ).all();
            return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
        }

        if (type === 'desa' && parent) {
            const { results } = await db.prepare(
                "SELECT kode_desa_lengkap, nama_desa FROM desa WHERE kode_kec = ? ORDER BY nama_desa ASC"
            ).bind(parent).all();
            return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json' } });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
