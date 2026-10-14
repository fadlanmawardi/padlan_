/**
 * Integration test fitur Chat antar User "SchoolHub" (versi 2).
 * Menjalankan simulasi alur nyata terhadap services/chat-service:
 *   1. User 1 (superadmin) mengirim pesan ke User 2 (admin/guru).
 *   2. Satu percakapan per pasangan (id deterministik), unread terhitung.
 *   3. Status pesan: sent -> delivered -> read (realtime receipt).
 *   4. Reply-to + attachment minimal, sanitasi, dan validasi keamanan.
 *   5. Hapus untuk saya (pesan & percakapan) tanpa menghilangkan data asli.
 *   6. Pencarian isi pesan hanya di percakapan milik user.
 *   7. Riwayat chat durabel (bisa diserialisasi penuh -> survive refresh).
 *
 * Jalankan: npx tsx scripts/chat-integration-test.ts
 */
let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(name: string) {
  passed++;
  console.log(`  PASS  ${name}`);
}

function fail(name: string, detail?: string) {
  failed++;
  failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`  FAIL  ${name}${detail ? ` (${detail})` : ""}`);
}

function expectCond(cond: boolean, name: string, detail?: string) {
  if (cond) ok(name);
  else fail(name, detail);
}

import {
  getChatUsers,
  getConversations,
  getMessages,
  getUnreadChatCount,
  hideConversationForMe,
  hideMessageForMe,
  markConversationDelivered,
  markConversationRead,
  searchMessages,
  sendMessage,
} from "../services/chat-service";
import {
  onChatDelivered,
  onChatMessage,
  onChatRead,
} from "../services/realtime-service";
import { chatConversationIdFor, dbChatData } from "../services/store";

async function main() {
  console.log("=== Chat antar User: alur 2 arah (superadmin <-> admin) ===");

  const user1 = "u-super"; // Hikmawan Surianto (Super Admin)
  const user2 = "u-a1"; // Budi Santoso (Admin/Guru)
  const user3 = "u-s01"; // Alya (Siswa)

  console.log("\n-- 1. Daftar user yang bisa diajak chat --");
  const chatUsers = await getChatUsers(user1);
  expectCond(
    chatUsers.some((u) => u.uid === user2),
    "User 1 melihat User 2 di daftar pengguna"
  );
  expectCond(
    !chatUsers.some((u) => u.uid === user1),
    "User 1 TIDAK melihat dirinya sendiri"
  );

  console.log("\n-- 2. User 1 -> User 2 (kirim 'Halo User 2') --");
  const sent = await sendMessage({
    senderId: user1,
    receiverId: user2,
    text: "Halo User 2",
  });
  expectCond(sent.senderId === user1, "senderId = User 1");
  expectCond(sent.receiverId === user2, "receiverId = User 2");
  expectCond(sent.status === "sent", "status awal = sent");
  expectCond(sent.readAt === null, "readAt masih null (belum dibaca)");

  const convIdPair = chatConversationIdFor(user1, user2);
  expectCond(
    chatConversationIdFor(user2, user1) === convIdPair,
    "Id percakapan deterministik (urutannya tidak berpengaruh)"
  );

  const convs1 = await getConversations(user2);
  const conv1 = convs1.find((c) => c.userId === user1);
  expectCond(Boolean(conv1), "User 2 melihat percakapan dengan User 1");
  expectCond(
    conv1?.conversationId === convIdPair,
    "Percakapan memakai id deterministik yang sama"
  );
  expectCond(
    conv1?.lastMessage === "Halo User 2",
    "Pratinjau pesan terakhir = 'Halo User 2'"
  );
  expectCond(conv1?.unreadCount === 1, "Unread User 2 = 1");
  expectCond(
    conv1?.lastMessageFromMe === false,
    "Pesannya dari User 1, bukan dari User 2"
  );

  console.log("\n-- 3. Satu percakapan per pasangan --");
  const sent2 = await sendMessage({
    senderId: user1,
    receiverId: user2,
    text: "Pesan kedua",
  });
  const pairConvos = dbChatData.conversations.filter(
    (c) => c.participants.includes(user1) && c.participants.includes(user2)
  );
  expectCond(pairConvos.length === 1, "Hanya ada 1 percakapan A<->B");
  expectCond(
    sent2.conversationId === sent.conversationId,
    "Pesan kedua masuk ke percakapan yang sama"
  );

  console.log("\n-- 4. Delivered: perangkat User 2 menerima pesan --");
  const deliveredReceipts: string[] = [];
  const unsubDelivered = onChatDelivered((p) => {
    if (p.partnerId === user1) deliveredReceipts.push(`${p.delivererId}@${p.deliveredAt}`);
  });
  await markConversationDelivered(user2, user1);
  unsubDelivered();
  expectCond(
    deliveredReceipts.length > 0 && deliveredReceipts[0].startsWith(user2),
    "Pengirim menerima notifikasi delivered dari User 2",
    deliveredReceipts.join(",")
  );
  const statusAfterDelivery = (
    await getMessages(user1, user2)
  ).find((m) => m.id === sent.id);
  expectCond(
    statusAfterDelivery?.status === "delivered",
    "Pesan berstatus delivered setelah sampai ke perangkat",
    statusAfterDelivery?.status
  );
  expectCond(
    statusAfterDelivery?.deliveredAt !== null && statusAfterDelivery?.readAt === null,
    "deliveredAt terisi, readAt belum (belum dibaca)"
  );

  console.log("\n-- 5. User 2 membuka percakapan -> pesan dibaca --");
  const msgsForUser2 = await getMessages(user2, user1);
  expectCond(msgsForUser2.length === 2, "User 2 melihat 2 pesan dari User 1");
  const readMsg = msgsForUser2.find((m) => m.id === sent.id);
  expectCond(readMsg?.status === "read", "Setelah dibuka, status pesan = read");
  expectCond(readMsg?.readAt !== null, "readAt terisi setelah dibaca");
  const unreadUser2 = await getUnreadChatCount(user2);
  expectCond(unreadUser2 === 0, "Unread User 2 hilang (0) setelah dibaca");

  console.log("\n-- 6. User 2 membalas 'Halo juga' -> User 1 menerimanya --");
  const reply = await sendMessage({
    senderId: user2,
    receiverId: user1,
    text: "Halo juga",
  });
  expectCond(reply.senderId === user2, "Balasan dikirim dari User 2");

  const msgsForUser1 = await getMessages(user1, user2);
  const replyMsg = msgsForUser1.find((m) => m.id === reply.id);
  expectCond(Boolean(replyMsg), "User 1 menerima balasan dari User 2");
  const convsFromUser1 = await getConversations(user1);
  const convFromUser1 = convsFromUser1.find((c) => c.userId === user2);
  expectCond(
    convFromUser1?.lastMessage === "Halo juga",
    "Pratinjau User 1 = 'Halo juga'"
  );
  expectCond(
    convFromUser1?.lastMessageFromMe === false,
    "Balasan ditandai dari User 2"
  );

  console.log("\n-- 7. Read receipt: User 1 membuka -> User 2 melihat 'read' --");
  const readReceipts: string[] = [];
  const unsubRead = onChatRead((p) => {
    if (p.partnerId === user2) readReceipts.push(p.readerId);
  });
  const fresh = await sendMessage({
    senderId: user2,
    receiverId: user1,
    text: "Pesan untuk di-read",
  });
  await markConversationRead(user1, user2);
  unsubRead();
  expectCond(
    readReceipts.length === 1 && readReceipts[0] === user1,
    "Pengirim menerima notifikasi read (readerId tercatat)",
    readReceipts.join(",")
  );
  const user2MsgsAfter = await getMessages(user2, user1);
  const sentReplyState = user2MsgsAfter.find((m) => m.id === fresh.id);
  expectCond(
    sentReplyState?.status === "read",
    "Pesan yang dibaca User 1 berstatus read",
    sentReplyState?.status
  );

  console.log("\n-- 8. Kirim dengan reply-to + lampiran minimal --");
  const withReply = await sendMessage({
    senderId: user1,
    receiverId: user2,
    text: "Ini membalas pesanmu",
    replyToId: reply.id,
    attachment: {
      name: "laporan.pdf",
      sizeKb: 2,
      type: "document",
      mime: "application/pdf",
    },
  });
  expectCond(withReply.replyToId === reply.id, "replyToId tersimpan");
  expectCond(
    withReply.attachment?.name === "laporan.pdf" &&
      withReply.attachment?.sizeKb === 2,
    "Lampiran (nama & ukuran) tersimpan"
  );
  const viewedByUser2 = (await getMessages(user2, user1)).find(
    (m) => m.id === withReply.id
  );
  expectCond(
    viewedByUser2?.attachment?.mime === "application/pdf",
    "Lampiran terlihat di sisi penerima"
  );

  console.log("\n-- 9. Keamanan: validasi pengirim/penerima --");
  let selfError = false;
  try {
    await sendMessage({ senderId: user1, receiverId: user1, text: "coba ke diri sendiri" });
  } catch {
    selfError = true;
  }
  expectCond(selfError, "Mengirim ke diri sendiri diblokir");

  let invalidReceiver = false;
  try {
    await sendMessage({ senderId: user1, receiverId: "u-tidak-ada", text: "coba" });
  } catch {
    invalidReceiver = true;
  }
  expectCond(invalidReceiver, "Receiver yang tidak terdaftar diblokir");

  const sanitized = await sendMessage({
    senderId: user1,
    receiverId: user2,
    text: `  Halo\n\nbesok\t  `,
  });
  expectCond(
    sanitized.message === "Halo\n\nbesok",
    "Isi pesan disanitasi (trim + buang karakter kontrol)"
  );

  console.log("\n-- 10. Hapus untuk saya: pesan --");
  await hideMessageForMe(user1, sent.id);
  const user1View = await getMessages(user1, user2);
  expectCond(
    !user1View.some((m) => m.id === sent.id),
    "Pesan 'Halo User 2' hilang dari tampilan User 1"
  );
  expectCond(
    dbChatData.messages.some((m) => m.id === sent.id),
    "Pesan asli TETAP tersimpan di database (soft-delete)"
  );
  const user2View = await getMessages(user2, user1);
  expectCond(
    user2View.some((m) => m.id === sent.id),
    "Pesan masih terlihat di sisi lawan bicara"
  );

  console.log("\n-- 11. Hapus untuk saya: percakapan --");
  await sendMessage({ senderId: user1, receiverId: user3, text: "Halo Alya" });
  const convWithUser3 = dbChatData.conversations.find((c) =>
    c.participants.includes(user1) && c.participants.includes(user3)
  );
  expectCond(Boolean(convWithUser3), "Percakapan User 1 <-> User 3 dibuat");

  const searchBeforeHide = await searchMessages(user1, "Halo Alya");
  expectCond(
    searchBeforeHide.some((r) => r.conversationId === convWithUser3?.id),
    "Pencarian menemukan isi pesan sebelum percakapan disembunyikan"
  );

  expectCond(Boolean(convWithUser3), "Percakapan ada sebelum disembunyikan");
  if (convWithUser3) {
    await hideConversationForMe(user1, convWithUser3.id);
  }
  const convsAfterHide = await getConversations(user1);
  expectCond(
    !convsAfterHide.some((c) => c.userId === user3),
    "Percakapan dengan User 3 hilang dari daftar User 1"
  );
  expectCond(
    dbChatData.conversations.some(
      (c) => c.id === convWithUser3?.id && c.participants.includes(user3)
    ),
    "Data percakapan asli TETAP tersimpan (tidak dihapus)"
  );
  const searchAfterHide = await searchMessages(user1, "Halo Alya");
  expectCond(
    searchAfterHide.length === 0,
    "Pesan di percakapan yang disembunyikan tidak muncul di pencarian"
  );

  console.log("\n-- 12. Pencarian hanya di percakapan milik user --");
  const searched = await searchMessages(user1, "Halo");
  expectCond(
    searched.every(
      (r) => r.peerId === user2 || r.peerId === user1
    ),
    "Hasil pencarian berasal dari percakapan User 1 saja"
  );
  expectCond(
    searched.some((r) => r.message.includes("Halo")),
    "Hasil memuat teks yang dicari"
  );

  console.log("\n-- 13. Realtime event: subscriber menerima pesan --");
  const received: string[] = [];
  const unsubMsg = onChatMessage(user2, (m) => {
    if (m.message === "Pesan realtime") received.push(m.message);
  });
  await sendMessage({ senderId: user1, receiverId: user2, text: "Pesan realtime" });
  unsubMsg();
  expectCond(
    received.includes("Pesan realtime"),
    "Subscriber menerima pesan realtime tanpa refresh"
  );

  console.log("\n-- 14. Riwayat chat durabel (serializable penuh) --");
  expectCond(
    dbChatData.messages.length > 0,
    "Pesan tersimpan di database chat"
  );
  const snapshot = JSON.stringify(dbChatData);
  const restored = JSON.parse(snapshot) as typeof dbChatData;
  expectCond(
    restored.messages.length === dbChatData.messages.length &&
      restored.conversations.length === dbChatData.conversations.length,
    "Seluruh riwayat dapat diserialisasi & direstore (survive refresh)"
  );
  const restoredFirst = restored.messages.find(
    (m) => m.id === sent.id
  );
  expectCond(
    Boolean(
      restoredFirst &&
        restoredFirst.status === "read" &&
        restoredFirst.readAt !== null
    ),
    "Status/readAt ikut terpulihkan setelah 'reload'"
  );

  console.log("\n-- 15. Unread akhir (semuanya sudah dibaca) --");
  await getMessages(user2, user1);
  await getMessages(user1, user2);
  expectCond(
    (await getUnreadChatCount(user1)) === 0,
    "Unread User 1 = 0"
  );
  expectCond(
    (await getUnreadChatCount(user2)) === 0,
    "Unread User 2 = 0"
  );

  console.log("\n=== RINGKASAN CHAT ===");
  console.log(`  Total: ${passed + failed}  PASS: ${passed}  FAIL: ${failed}`);
  if (failures.length > 0) {
    console.log("\n  Gagal:");
    for (const f of failures) console.log(`    - ${f}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error("Test crash:", error);
  process.exit(1);
});