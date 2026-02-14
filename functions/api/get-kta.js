export async function onRequest(context) {
    const { request, env } = context;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // ID Pengurus
    const nikParam = searchParams.get('nik'); // Atau NIK

    if (!id && !nikParam) return new Response("ID or NIK required", { status: 400 });

    const db = env.DB;

    try {
        // 1. Ambil Data Pengurus
        let query = `
            SELECT p.*, d.nama_desa, k.nama_kecamatan 
            FROM pengurus p
            LEFT JOIN desa d ON p.kode_desa_lengkap = d.kode_desa_lengkap
            LEFT JOIN kecamatan k ON d.kode_kec = k.kode_kec
            WHERE `;
        
        if (id) query += "p.id = ?";
        else query += "p.nik = ?";

        const pengurus = await db.prepare(query).bind(id || nikParam).first();

        if (!pengurus) return new Response("Data tidak ditemukan", { status: 404 });

        // 2. Logic Standarisasi Nomor HP
        let hp = pengurus.no_hp || "";
        hp = hp.replace(/[^0-9]/g, ""); // Hapus semua karakter selain angka (termasuk - dan spasi)
        if (hp.startsWith("0")) {
            hp = "62" + hp.slice(1);
        } else if (hp.startsWith("8")) {
            hp = "62" + hp;
        }
        // Jika sudah 62 biarkan. Hasil akhirnya +62...
        const finalHp = "+" + hp;

        // 3. Logic Generate No KTA (Jika belum punya)
        let finalKta = pengurus.no_kta;

        if (!finalKta) {
            const nik = pengurus.nik;
            
            // Rumus: Digit 1-6 + 11-12 + 9-10 + 7-8
            // Indeks string mulai dari 0.
            // 1-6   => substring(0, 6)
            // 11-12 => substring(10, 12)
            // 9-10  => substring(8, 10)
            // 7-8   => substring(6, 8)
            
            if (nik.length >= 12) {
                const part1 = nik.substring(0, 6);
                const part2 = nik.substring(10, 12);
                const part3 = nik.substring(8, 10);
                const part4 = nik.substring(6, 8);
                const baseKta = part1 + part2 + part3 + part4; // Total 12 Digit

                // Cek Sequence di Database
                // Cari KTA yang depannya sama (baseKta)
                const lastKta = await db.prepare("SELECT no_kta FROM pengurus WHERE no_kta LIKE ? ORDER BY no_kta DESC LIMIT 1")
                    .bind(baseKta + '%').first();

                let seq = 1;
                if (lastKta && lastKta.no_kta) {
                    // Ambil 4 digit terakhir
                    const lastSeq = parseInt(lastKta.no_kta.slice(-4));
                    if (!isNaN(lastSeq)) seq = lastSeq + 1;
                }

                const seqString = seq.toString().padStart(4, '0');
                finalKta = baseKta + seqString;

                // Simpan ke Database agar permanen
                await db.prepare("UPDATE pengurus SET no_kta = ? WHERE id = ?").bind(finalKta, pengurus.id).run();
            } else {
                finalKta = nik; // Fallback jika NIK rusak
            }
        }

        // Return Data Lengkap untuk Cetak
        const result = {
            ...pengurus,
            no_kta: finalKta,
            no_hp_format: finalHp
        };

        return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
