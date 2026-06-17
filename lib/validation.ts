import { prisma } from "@/lib/prisma";

export type CheckInPayload = {
  title?: string;
  content?: string;
  studyDate?: string;
  duration?: number | string;
  mood?: string;
  categoryId?: string;
};

export type CategoryPayload = {
  name?: string;
  color?: string;
  icon?: string;
};

export function parseStudyDate(value: string) {
  const parsedDate = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export async function validateCheckInPayload(body: CheckInPayload) {
  const title = body.title?.trim();
  const content = body.content?.trim();
  const categoryId = body.categoryId?.trim();
  const studyDate = body.studyDate?.trim();
  const duration = Number(body.duration);
  const mood = body.mood?.trim() || null;

  if (!title) {
    return { message: "学习标题不能为空" };
  }

  if (title.length > 50) {
    return { message: "学习标题不能超过 50 个字符" };
  }

  if (!categoryId) {
    return { message: "请选择学习分类" };
  }

  if (!studyDate) {
    return { message: "学习日期不能为空" };
  }

  if (!Number.isInteger(duration) || duration <= 0) {
    return { message: "学习时长必须是大于 0 的整数" };
  }

  if (duration > 1440) {
    return { message: "学习时长不能超过 1440 分钟" };
  }

  if (!content) {
    return { message: "学习内容不能为空" };
  }

  if (content.length > 1000) {
    return { message: "学习内容不能超过 1000 个字符" };
  }

  const parsedDate = parseStudyDate(studyDate);

  if (!parsedDate) {
    return { message: "学习日期格式不正确" };
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return { message: "分类不存在" };
  }

  return {
    data: {
      title,
      content,
      studyDate: parsedDate,
      duration,
      mood,
      categoryId,
    },
  };
}

export function validateCategoryPayload(body: CategoryPayload) {
  const name = body.name?.trim();
  const color = body.color?.trim() || "#3B82F6";
  const icon = body.icon?.trim() || "BookOpen";

  if (!name) {
    return { message: "分类名称不能为空" };
  }

  if (name.length > 20) {
    return { message: "分类名称不能超过 20 个字符" };
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { message: "分类颜色格式不正确" };
  }

  return {
    data: {
      name,
      color,
      icon,
    },
  };
}
