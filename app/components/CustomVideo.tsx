"use client";

export function CustomVideo({ vidAddress }: { vidAddress: string }) {
  return (
    <div className="rounded aspect-video w-full">
      <video
        src={vidAddress}
        playsInline
        className="w-full h-full rounded"
        preload="metadata"
        controls
      />
    </div>
  );
}

export default CustomVideo;
