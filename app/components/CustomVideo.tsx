export function CustomVideo({ vidAddress }: { vidAddress: string }) {
  return (
    <div className=" rounded">
      <video src={vidAddress} playsInline controls autoPlay />
    </div>
  );
}

export default CustomVideo;
