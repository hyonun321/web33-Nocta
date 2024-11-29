import { WorkspaceListItem } from "@noctaCrdt/Interfaces"; // 이전에 만든 인터페이스 import
import { useSocketStore } from "@src/stores/useSocketStore";
import { useUserInfo } from "@src/stores/useUserStore";
import {
  itemContainer,
  itemContent,
  itemIcon,
  itemInfo,
  itemMemberCount,
  itemName,
  itemRole,
} from "./WorkspaceSelectItem.style";

interface WorkspaceSelectItemProps extends WorkspaceListItem {
  userName: string;
}

export const WorkspaceSelectItem = ({
  id,
  name,
  role,
  memberCount,
  userName,
}: WorkspaceSelectItemProps) => {
  const { userId } = useUserInfo();
  const switchWorkspace = useSocketStore((state) => state.switchWorkspace);
  const handleClick = () => {
    console.log("Selected workspace:", id, name, role, memberCount, userName);
    switchWorkspace(userId, id);
  };

  return (
    <button className={itemContainer} onClick={handleClick}>
      <div className={itemContent}>
        <div className={itemIcon}>{name.charAt(0)}</div>
        <div className={itemInfo}>
          <span className={itemName}>{name}</span>
          <span className={itemMemberCount}>{role}</span>
        </div>
      </div>

      {memberCount !== undefined && <span className={itemRole}>접속자수 : {memberCount} 명 </span>}
    </button>
  );
};
