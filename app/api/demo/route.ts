import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, instituteName, email, phone, message, demoDate } = await req.json();

    if (!name || !instituteName || !email || !phone || !demoDate) {
      return NextResponse.json(
        { message: "Missing required fields for booking demo" },
        { status: 400 }
      );
    }

    // Since this is a public placeholder API, we just log the data.
    // In a real application, we would store this in a 'DemoBooking' table or send an email.
    console.log("DEMO BOOKING RECEIVED:", {
      name,
      instituteName,
      email,
      phone,
      message,
      demoDate,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Demo booked successfully!",
    });
  } catch (error: any) {
    console.error("DEMO BOOKING ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error booking demo", error: String(error) },
      { status: 500 }
    );
  }
}
