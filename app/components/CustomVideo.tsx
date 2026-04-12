"use client";

export function CustomVideo({
  vidAddress,
  poster,
}: {
  vidAddress: string;
  poster?: string;
}) {
  return (
    <div className="rounded aspect-video w-full">
      <video
        src={vidAddress}
        poster={poster}
        playsInline
        className="w-full h-full rounded"
        preload={poster ? "none" : "metadata"}
        controls
      />
    </div>
  );
}

export default CustomVideo;
