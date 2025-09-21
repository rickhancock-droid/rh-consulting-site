export function videoObjectJSONLD({name, description, thumbnailUrl, uploadDate, embedUrl, contentUrl}:{
  name:string; description:string; thumbnailUrl:string; uploadDate:string; embedUrl:string; contentUrl?:string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name, description, thumbnailUrl, uploadDate, embedUrl, contentUrl,
    publisher: { "@type": "Organization", name: "RH Consulting", logo: { "@type":"ImageObject", url:"https://www.rhconsulting.ai/logo.png" } }
  };
}

