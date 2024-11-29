import { motion } from "framer-motion";
import { useRef } from "react";
import { SIDE_BAR } from "@constants/size";
import { useSocketStore } from "@src/stores/useSocketStore";
import { css } from "@styled-system/css";
import {
  workspaceListContainer,
  workspaceModalContainer,
  textBox,
} from "./WorkspaceSelectModal.style";
import { WorkspaceSelectItem } from "./components/WorkspaceSelectItem";

interface WorkspaceSelectModalProps {
  isOpen: boolean;
  userName: string | null;
}

export const WorkspaceSelectModal = ({ isOpen, userName }: WorkspaceSelectModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { availableWorkspaces } = useSocketStore(); // 소켓 스토어에서 직접 워크스페이스 목록 가져오기

  const informText = userName
    ? availableWorkspaces.length > 0
      ? ""
      : "접속할 수 있는 워크스페이스가 없습니다."
    : `다른 워크스페이스 기능은\n 회원전용 입니다`;
  return (
    <motion.div
      ref={modalRef}
      className={workspaceModalContainer}
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isOpen ? 1 : 0,
        y: isOpen ? 0 : -20,
      }}
      transition={{ duration: 0.2 }}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        left: -1,
        width: SIDE_BAR.WIDTH,
        zIndex: 20,
        pointerEvents: isOpen ? "auto" : "none",
        display: isOpen ? "block" : "none",
      }}
    >
      <div className={workspaceListContainer}>
        {userName && availableWorkspaces.length > 0 ? (
          availableWorkspaces.map((workspace) => (
            <WorkspaceSelectItem key={workspace.id} userName={userName} {...workspace} />
          ))
        ) : (
          <p className={textBox}>{informText}</p>
        )}
      </div>
    </motion.div>
  );
};
