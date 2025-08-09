import { NextRequest, NextResponse } from "next/server";

// Simple ping endpoint for connection health checks
// Used by the offline system to detect connectivity
export async function GET(request: NextRequest) {
  try {
    // Quick and light response for heartbeat checks
    return NextResponse.json({ 
      ok: true, 
      timestamp: Date.now(),
      status: 'online'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Ping endpoint error:', error);
    return NextResponse.json({ 
      ok: false, 
      timestamp: Date.now(),
      status: 'error'
    }, { 
      status: 500 
    });
  }
}
