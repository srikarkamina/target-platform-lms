import { NextResponse } from "next/server";

export function sendResponse(req: Request, data: any, message?: string, status: number = 200) {
  let isStandardized = false;
  
  if (req && typeof req.headers?.get === "function") {
    isStandardized = req.headers.get("x-standardized") === "true";
    if (!isStandardized && req.url) {
      try {
        const { searchParams } = new URL(req.url);
        isStandardized = searchParams.get("standardized") === "true";
      } catch {
        // Safe fallback
      }
    }
  }

  if (isStandardized) {
    return NextResponse.json(
      {
        success: true,
        data,
        message,
      },
      { status }
    );
  }

  return NextResponse.json(data, { status });
}

export function sendError(message: string, error?: any, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
      error: error ? String(error) : undefined,
    },
    { status }
  );
}
