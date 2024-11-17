import { Player } from "@lottiefiles/react-lottie-player";
import errorAlert from "@assets/lotties/errorAlert.json";
import { TextButton } from "@src/components/button/textButton";
import { glassContainer } from "@styled-system/recipes";
import {
  modalWrapper,
  overlay,
  content,
  title,
  message,
  animationContainer,
} from "./ErrorScreen.style";

interface ErrorScreenProps {
  errorMessage: string;
}

export const ErrorScreen = ({ errorMessage }: ErrorScreenProps) => {
  return (
    <div className={overlay}>
      <div className={`${glassContainer({ border: "lg" })} ${modalWrapper}`}>
        <div className={animationContainer}>
          <Player autoplay loop src={errorAlert} style={{ width: "100%", height: "100%" }} />
        </div>

        <div className={content}>
          <h2 className={title}>오류가 발생했습니다.</h2>
          <p className={message}>{errorMessage}</p>
          <TextButton onClick={() => window.location.reload()} variant="primary">
            새로고침
          </TextButton>
        </div>
      </div>
    </div>
  );
};
