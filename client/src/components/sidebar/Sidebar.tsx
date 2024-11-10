import { MenuButton } from "./MenuButton";
import { PageItem } from "./PageItem";
import { sidebarContainer, navWrapper } from "./Sidebar.style";

interface NavItem {
  id: number;
  page: string;
  icon: string;
}

export const Sidebar = () => {
  const navItems: NavItem[] = [
    { id: 1, page: "Page 1", icon: "🏠" },
    { id: 2, page: "Page 2", icon: "🔍" },
    { id: 3, page: "Page 3", icon: "📚" },
  ];

  return (
    <aside className={sidebarContainer}>
      <MenuButton />
      <nav className={navWrapper}>
        {navItems?.map((item) => <PageItem key={item.id} {...item} />)}
      </nav>
    </aside>
  );
};
