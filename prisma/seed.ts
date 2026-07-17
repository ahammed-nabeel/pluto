import { PrismaClient, GlobalRole, BoardMemberRole, CardSource, CardLabel, TaskPriority } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Proteus database...");

  // ── Super Admin ───────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@proteus.app" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@proteus.app",
      auth_provider: "credentials",
      role: GlobalRole.super_admin,
      status: "active",
    },
  });
  console.log("✅ Super admin:", superAdmin.email);

  // ── Demo Users ────────────────────────────────────
  const alice = await prisma.user.upsert({
    where: { email: "alice@demo.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@demo.com",
      auth_provider: "google",
      role: GlobalRole.admin,
      status: "active",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@demo.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@demo.com",
      auth_provider: "google",
      role: GlobalRole.member,
      status: "active",
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: "carol@demo.com" },
    update: {},
    create: {
      name: "Carol Williams",
      email: "carol@demo.com",
      auth_provider: "microsoft",
      role: GlobalRole.member,
      status: "active",
    },
  });
  console.log("✅ Demo users created");

  // ── Sample Board ──────────────────────────────────
  const board = await prisma.board.upsert({
    where: { id: "demo-board-id" },
    update: {},
    create: {
      id: "demo-board-id",
      name: "Sales Pipeline Q3",
      description: "Tracking all leads and projects for Q3 2026",
      owner_id: alice.id,
      settings: {
        currency: "INR",
        permissions: {
          member: { create_card: true, delete_card: false, view_reports: true },
          viewer: { create_card: false, delete_card: false, view_reports: false },
        },
      },
    },
  });

  // Board members
  await prisma.boardMember.upsert({
    where: { board_id_user_id: { board_id: board.id, user_id: alice.id } },
    update: {},
    create: {
      board_id: board.id,
      user_id: alice.id,
      role: BoardMemberRole.admin,
      permissions: { create_list: true, delete_card: true, assign_task: true, view_reports: true, manage_members: true },
    },
  });

  await prisma.boardMember.upsert({
    where: { board_id_user_id: { board_id: board.id, user_id: bob.id } },
    update: {},
    create: {
      board_id: board.id,
      user_id: bob.id,
      role: BoardMemberRole.member,
      permissions: { create_list: false, delete_card: false, assign_task: true, view_reports: true, manage_members: false },
    },
  });

  await prisma.boardMember.upsert({
    where: { board_id_user_id: { board_id: board.id, user_id: carol.id } },
    update: {},
    create: {
      board_id: board.id,
      user_id: carol.id,
      role: BoardMemberRole.viewer,
      permissions: { create_list: false, delete_card: false, assign_task: false, view_reports: false, manage_members: false },
    },
  });
  console.log("✅ Board and members created");

  // ── Lists ─────────────────────────────────────────
  const listData = [
    { title: "New Leads", position: 1000 },
    { title: "Contacted", position: 2000 },
    { title: "Negotiation", position: 3000 },
    { title: "Won", position: 4000 },
    { title: "Lost", position: 5000 },
  ];

  const lists = [];
  for (const l of listData) {
    const list = await prisma.list.create({
      data: {
        board_id: board.id,
        title: l.title,
        position: l.position,
        created_by: alice.id,
      },
    });
    lists.push(list);
  }
  console.log("✅ Lists created:", lists.map(l => l.title).join(", "));

  // ── Sample Cards ──────────────────────────────────
  const cardsData = [
    {
      list_id: lists[0].id,
      project_name: "Home Automation — 3BHK Whitefield",
      product: "Smart Home Kit Pro",
      source: CardSource.Meta,
      description: "Customer interested in full home automation for 3BHK flat in Whitefield.",
      card_value: 125000,
      label: CardLabel.Hot,
      client_name: "Rajesh Kumar",
      contact_number: "+919876543210",
      card_owner_id: alice.id,
      position: 1000,
      tags: ["home-automation", "whitefield", "3bhk"],
    },
    {
      list_id: lists[0].id,
      project_name: "CCTV Installation — Commercial",
      product: "CCTV 8-Camera Package",
      source: CardSource.Google,
      description: "Retail store needs 8-camera CCTV setup with cloud recording.",
      card_value: 45000,
      label: CardLabel.Warm,
      client_name: "Priya Mehta",
      contact_number: "+919823456789",
      card_owner_id: bob.id,
      position: 2000,
      tags: ["cctv", "commercial"],
    },
    {
      list_id: lists[1].id,
      project_name: "Security System — Villa",
      product: "Security Bundle Elite",
      source: CardSource.Referral,
      description: "High-end villa security system with biometrics and alarm integration.",
      card_value: 280000,
      label: CardLabel.Hot,
      client_name: "Sundar Rao",
      contact_number: "+919711234567",
      card_owner_id: alice.id,
      position: 1000,
      tags: ["security", "villa", "biometrics"],
    },
    {
      list_id: lists[2].id,
      project_name: "Automated Gate — Apartment",
      product: "Smart Gate Controller",
      source: CardSource.IVR,
      description: "Society automated gate with RFID and mobile app control.",
      card_value: 95000,
      label: CardLabel.Warm,
      client_name: "Kavya Sharma",
      contact_number: "+918899001122",
      card_owner_id: bob.id,
      position: 1000,
      tags: ["gate", "apartment", "rfid"],
    },
  ];

  for (const card of cardsData) {
    await prisma.card.create({
      data: {
        ...card,
        board_id: board.id,
        created_by: alice.id,
        card_value: card.card_value,
      },
    });
  }
  console.log("✅ Sample cards created");

  // ── Checklist Templates ───────────────────────────
  await prisma.checklistTemplate.create({
    data: {
      board_id: board.id,
      name: "Site Visit Checklist",
      items: [
        { id: "1", text: "Confirm appointment with client", order: 1 },
        { id: "2", text: "Site survey completed", order: 2 },
        { id: "3", text: "Measurements taken", order: 3 },
        { id: "4", text: "Photos captured", order: 4 },
        { id: "5", text: "Quote prepared", order: 5 },
      ],
      created_by: alice.id,
    },
  });

  await prisma.checklistTemplate.create({
    data: {
      board_id: null, // global template
      name: "Installation Checklist",
      items: [
        { id: "1", text: "Materials procured", order: 1 },
        { id: "2", text: "Installation team scheduled", order: 2 },
        { id: "3", text: "Installation completed", order: 3 },
        { id: "4", text: "Testing done", order: 4 },
        { id: "5", text: "Client sign-off obtained", order: 5 },
        { id: "6", text: "Invoice raised", order: 6 },
      ],
      created_by: superAdmin.id,
    },
  });
  console.log("✅ Checklist templates created");

  // ── Activity Logs ─────────────────────────────────
  await prisma.activityLog.create({
    data: {
      board_id: board.id,
      action: "Created board 'Sales Pipeline Q3'",
      action_type: "board_created",
      performed_by: alice.id,
    },
  });
  console.log("✅ Activity logs seeded");

  console.log("\n🎉 Seeding complete!");
  console.log("Board ID:", board.id);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
