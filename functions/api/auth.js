export async function onRequestPost(context) {
  const { username, password } = await context.request.json();
  const db = context.env.DB;

  const user = await db.prepare("SELECT * FROM users WHERE username = ? AND password = ?")
    .bind(username, password).first();

  if (!user) {
    return new Response(JSON.stringify({ error: "Login Gagal" }), { status: 401 });
  }

  // Kirim data user & role (Di produksi, gunakan JWT di Cookie)
  return new Response(JSON.stringify({ 
    success: true, 
    user: { username: user.username, role: user.role } 
  }));
}
