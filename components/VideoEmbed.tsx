export function VideoEmbed({ vimeoId, title }:{ vimeoId:string; title:string }) {
  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-2xl card">
      <iframe
        src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

