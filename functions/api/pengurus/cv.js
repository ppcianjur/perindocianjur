export async function onRequest(context) {
    const { request, env } = context;
    const db = env.DB;

    // --- GET: Ambil Data Riwayat ---
    if (request.method === "GET") {
        const { searchParams } = new URL(request.url);
        const nik = searchParams.get('nik');

        if (!nik) return new Response("NIK Required", { status: 400 });

        const data = await db.prepare("SELECT riwayat_pendidikan, riwayat_organisasi, riwayat_pekerjaan FROM pengurus WHERE nik = ?").bind(nik).first();
        
        return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    }

    // --- POST: Simpan Data Riwayat ---
    if (request.method === "POST") {
        try {
            const { nik, pendidikan, organisasi, pekerjaan } = await request.json();

            // Simpan sebagai JSON String
            await db.prepare(`
                UPDATE pengurus 
                SET riwayat_pendidikan = ?, 
                    riwayat_organisasi = ?, 
                    riwayat_pekerjaan = ? 
                WHERE nik = ?
            `).bind(
                JSON.stringify(pendidikan), 
                JSON.stringify(organisasi), 
                JSON.stringify(pekerjaan), 
                nik
            ).run();

            return new Response(JSON.stringify({ success: true }));
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
}
