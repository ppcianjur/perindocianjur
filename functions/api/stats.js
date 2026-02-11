export async function onRequestGet(context) {
    const db = context.env.DB;

    try {
        // 1. Hitung Total Pengurus
        const pengurus = await db.prepare("SELECT COUNT(*) as total FROM pengurus").first();
        
        // 2. Hitung Total Users (Petugas)
        const users = await db.prepare("SELECT COUNT(*) as total FROM users").first();

        // 3. Hitung Desa Terisi (Berapa desa yang sudah ada pengurusnya)
        const desa = await db.prepare("SELECT COUNT(DISTINCT kode_desa_lengkap) as total FROM pengurus").first();

        return new Response(JSON.stringify({
            total_pengurus: pengurus.total,
            total_users: users.total,
            total_desa: desa.total
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
