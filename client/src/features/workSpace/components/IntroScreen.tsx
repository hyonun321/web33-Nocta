import { LoadingSpinner } from "@components/loading/LoadingSpinner";

interface IntroScreenProps {
  isVisible: boolean;
}

export const IntroScreen = ({ isVisible }: IntroScreenProps) => {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-white z-50"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 0.5s ease-in-out",
      }}
    >
      <LoadingSpinner size={200} />
    </div>
  );
};
