import { pdfForms } from '../data/forms.js';

export async function GET() {
  const baseUrl = 'https://allform.dev';
  const currentDate = new Date().toISOString();
  
  const staticPages = [
    {
      url: baseUrl,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0'
    },
    {
      url: `${baseUrl}/#features`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8'
    },
    {
      url: `${baseUrl}/#forms`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.9'
    }
  ];
  
  const pdfPages = pdfForms.map(form => ({
    url: `${baseUrl}/pdf/${form.id}`,
    lastmod: currentDate,
    changefreq: 'weekly',
    priority: '0.7'
  }));
  
  const editPages = pdfForms.map(form => ({
    url: `${baseUrl}/edit/${form.id}`,
    lastmod: currentDate,
    changefreq: 'monthly',
    priority: '0.6'
  }));
  
  const allPages = [...staticPages, ...pdfPages, ...editPages];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
