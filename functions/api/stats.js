export async function onRequestGet(context) {
    const db = context.env.DB;

    try {
        // 1. Hitung Total Pengurus (Data Masuk)
        const pengurus = await db.prepare("SELECT COUNT(*) as total FROM pengurus").first();
        
        // 2. Hitung Total Petugas (Hanya Role 'user', Admin tidak dihitung)
        const users = await db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'user'").first();

        // 3. Hitung Desa Terisi
        const desa = await db.prepare("SELECT COUNT(DISTINCT kode_desa_lengkap) as total FROM pengurus").first();

        // 4. Hitung Kecamatan Terisi (Ambil 8 karakter awal: 32.03.XX)
        const kec = await db.prepare("SELECT COUNT(DISTINCT substr(kode_desa_lengkap, 1, 8)) as total FROM pengurus").first();

        return new Response(JSON.stringify({
            total_pengurus: pengurus.total,
            total_users: users.total,
            total_desa: desa.total,
            total_kec: kec.total
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
