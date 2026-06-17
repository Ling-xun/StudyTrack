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
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
