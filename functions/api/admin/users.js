export async function onRequest(context) {
    const { request, env } = context;
    const db = env.DB;

    // GET: Ambil daftar user (HANYA PETUGAS / ROLE 'USER')
    if (request.method === "GET") {
        const { results } = await db.prepare("SELECT id, username, role FROM users WHERE role = 'user' ORDER BY id DESC").all();
        return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
    }

    // POST: Tambah User Baru
    if (request.method === "POST") {
        const { username, password, role } = await request.json();
        try {
            await db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)")
                .bind(username, password, role).run();
            return new Response(JSON.stringify({ success: true }));
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: "Username mungkin sudah ada!" }), { status: 400 });
        }
    }

    // DELETE: Hapus User
    if (request.method === "DELETE") {
        const { id } = await request.json();
        await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
        return new Response(JSON.stringify({ success: true }));
    }

    return new Response("Method not allowed", { status: 405 });
}
