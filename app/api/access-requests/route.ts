import { NextRequest, NextResponse } from "next/server";
import { AccessRequestService } from "@/lib/services/access-request.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      instituteName,
      ownerName,
      email,
      phone,
      city,
      state,
      country,
      website,
      requestedPlan,
      message,
    } = body;

    // Validate parameters
    if (
      !instituteName ||
      !ownerName ||
      !email ||
      !phone ||
      !city ||
      !state ||
      !country ||
      !requestedPlan
    ) {
      return NextResponse.json(
        { message: "Please provide all required registration fields." },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const request = await AccessRequestService.createRequest(
      {
        instituteName,
        ownerName,
        email,
        phone,
        city,
        state,
        country,
        website,
        requestedPlan,
        message,
      },
      ip,
      userAgent
    );

    return NextResponse.json(
      {
        success: true,
        message: "Your access request has been submitted successfully.",
        request,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("ACCESS REQUEST CREATION ERROR:", error);
    return NextResponse.json(
      { message: error.message || "An unexpected error occurred. Please try again." },
      { status: error.message?.includes("already have") ? 409 : 500 }
    );
  }
}
