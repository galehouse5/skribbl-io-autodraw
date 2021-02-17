addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  });
  
  async function handleRequest(request) {
    if (request.headers.get('Origin') !== 'https://skribbl.io')
      return new Response('Origin is invalid.', { status: 400 });
  
    const requestUrl = new URL(request.url);
    if (!requestUrl.search)
      return new Response('URL is required.', { status: 400 });
        
    const proxyUrl = decodeURIComponent(requestUrl.search.substring(1));
    try { new URL(proxyUrl); }
    catch { return new Response('URL is invalid.', { status: 400 }); }
  
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#preflighted_requests
    if (request.method === 'OPTIONS') {
      let responseHeaders = {
          'Access-Control-Allow-Origin': 'https://skribbl.io',
          'Access-Control-Allow-Methods': request.headers.get('Access-Control-Request-Method'),
          'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers'),
          // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
          'Access-Control-Max-Age': 86400 // Browser cap is 24 hours.
      };
      return new Response(null, { headers: responseHeaders });
    }
  
    let response = await fetch(proxyUrl, request);
    // Make the headers mutable by copying the response.
    response = new Response(response.body, response);
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests
    response.headers.set('Access-Control-Allow-Origin', 'https://skribbl.io');
    return response;
  };