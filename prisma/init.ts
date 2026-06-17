import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "C++", color: "#3B82F6", icon: "Code" },
  { name: "算法", color: "#8B5CF6", icon: "Brain" },
  { name: "操作系统", color: "#F97316", icon: "Cpu" },
  { name: "计算机网络", color: "#22C55E", icon: "Network" },
  { name: "英语", color: "#EC4899", icon: "Languages" },
  { name: "课程复习", color: "#14B8A6", icon: "BookOpen" },
  { name: "其他", color: "#64748B", icon: "Sparkles" },
];

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "color" TEXT NOT NULL DEFAULT '#3B82F6',
      "icon" TEXT NOT NULL DEFAULT 'BookOpen',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CheckIn" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "studyDate" DATETIME NOT NULL,
      "duration" INTEGER NOT NULL,
      "mood" TEXT,
      "categoryId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "CheckIn_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
  `);

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Database initialized.");
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
