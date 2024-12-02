import { WorkspaceListItem } from "@noctaCrdt/Interfaces"; // 이전에 만든 인터페이스 import
import { useSocketStore } from "@src/stores/useSocketStore";
import { useToastStore } from "@src/stores/useToastStore";
import { useUserInfo } from "@src/stores/useUserStore";
import { useWorkspaceStore } from "@src/stores/useWorkspaceStore";
import {
  itemContainer,
  itemContent,
  itemIcon,
  itemInfo,
  itemMemberCount,
  itemName,
  itemRole,
  informBox,
  activeItem, // 추가: 활성화된 아이템 스타일
} from "./WorkspaceSelectItem.style";

interface WorkspaceSelectItemProps extends WorkspaceListItem {
  userName: string;
}

export const WorkspaceSelectItem = ({
  id,
  name,
  role,
  memberCount,
  activeUsers,
}: WorkspaceSelectItemProps) => {
  const { userId } = useUserInfo();
  const { workspace, switchWorkspace } = useSocketStore();
  const { addToast } = useToastStore();
  const setCurrentRole = useWorkspaceStore((state) => state.setCurrentRole);
  const isActive = workspace?.id === id; // 현재 워크스페이스 확인
  const handleClick = () => {
    if (!isActive) {
      switchWorkspace(userId, id);
      setCurrentRole(role);
      addToast(`워크스페이스(${name})에 접속하였습니다.`);
    }
  };

  return (
    <button className={`${itemContainer} ${isActive ? activeItem : ""}`} onClick={handleClick}>
      <div className={itemContent}>
        <div className={itemIcon}>{name.charAt(0)}</div>
        <div className={itemInfo}>
          <span className={itemName}>{name}</span>
          <div className={informBox}>
            <span className={itemMemberCount}>{role}</span>
            {memberCount !== undefined && (
              <span className={itemRole}>
                접속자수 {activeUsers} / {memberCount} 명{" "}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
