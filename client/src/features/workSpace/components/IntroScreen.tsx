import { LoadingSpinner } from "@components/lotties/LoadingSpinner";
import { IntroScreenContainer } from "./IntroScreen.style";

export const IntroScreen = () => {
  return (
    <div className={IntroScreenContainer}>
      <LoadingSpinner size={200} />
    </div>
  );
};
