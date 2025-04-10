import { NextRequest, NextResponse } from 'next/server';

export function corsMiddleware(req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>) {
  // Check the origin
  const origin = req.headers.get('origin') || '*';
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  // Handle the actual request
  return handler(req).then(response => {
    // Add CORS headers to the response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  });
} 