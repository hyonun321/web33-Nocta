import { LoadingSpinner } from "@components/loading/LoadingSpinner";

export const IntroScreen = () => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-white z-50"
      style={{
        transition: "opacity 0.5s ease-in-out",
      }}
    >
      <LoadingSpinner size={200} />
    </div>
  );
};
