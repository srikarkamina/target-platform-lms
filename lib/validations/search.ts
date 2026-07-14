export interface SearchParams {
  q: string;
  page: number;
  limit: number;
  type?: string;
}

export function validateSearchParams(params: {
  q?: string | null;
  page?: string | null;
  limit?: string | null;
  type?: string | null;
}): { success: true; data: SearchParams } | { success: false; error: string } {
  if (!params.q || typeof params.q !== "string" || params.q.trim().length === 0) {
    return { success: false, error: "Search query 'q' is required and cannot be empty." };
  }

  let pageNum = 1;
  if (params.page) {
    pageNum = parseInt(params.page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return { success: false, error: "Parameter 'page' must be a positive integer >= 1." };
    }
  }

  let limitNum = 10;
  if (params.limit) {
    limitNum = parseInt(params.limit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return { success: false, error: "Parameter 'limit' must be a positive integer between 1 and 100." };
    }
  }

  const allowedTypes = [
    "students",
    "faculty",
    "courses",
    "assignments",
    "quizzes",
    "certificates",
    "certificateTemplates",
    "videos",
    "studyMaterials",
    "reports",
    "notifications",
  ];

  let searchType: string | undefined = undefined;
  if (params.type) {
    if (!allowedTypes.includes(params.type)) {
      return { success: false, error: `Parameter 'type' must be one of: ${allowedTypes.join(", ")}` };
    }
    searchType = params.type;
  }

  return {
    success: true,
    data: {
      q: params.q.trim(),
      page: pageNum,
      limit: limitNum,
      type: searchType,
    },
  };
}
