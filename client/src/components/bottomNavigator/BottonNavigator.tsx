import { IconButton } from "@components/button/IconButton";
import { bottomNavigatorContainer } from "./BottonNavigator.style";

interface NavItem {
  id: number;
  icon: string;
}

export const BottomNavigator = () => {
  const items: NavItem[] = [
    {
      id: 1,
      icon: "🏠",
    },
    {
      id: 2,
      icon: "🔍",
    },
    {
      id: 3,
      icon: "📚",
    },
  ];

  return (
    <div className={bottomNavigatorContainer}>
      {items?.map(({ id, icon }) => <IconButton icon={icon} key={id} size="md" />)}
    </div>
  );
};
