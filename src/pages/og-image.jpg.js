// This is a placeholder for Open Graph image generation
// In a real implementation, you would generate dynamic OG images
// For now, we'll return a redirect to a static image

export async function GET() {
  // Redirect to a static OG image
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/og-image-static.jpg'
    }
  });
}
