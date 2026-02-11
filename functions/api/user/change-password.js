export async function onRequestPost(context) {
    try {
        const { username, oldPassword, newPassword } = await context.request.json();
        const db = context.env.DB;

        // 1. Cek password lama
        const user = await db.prepare("SELECT * FROM users WHERE username = ? AND password = ?")
            .bind(username, oldPassword).first();

        if (!user) {
            return new Response(JSON.stringify({ success: false, error: "Password lama salah!" }), { status: 401 });
        }

        // 2. Update password
        await db.prepare("UPDATE users SET password = ? WHERE username = ?")
            .bind(newPassword, username).run();

        return new Response(JSON.stringify({ success: true }));

    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500 });
    }
}
