import { ElementType } from "@noctaCrdt/Interfaces";

// Fix: 서윤님 피드백 반영
interface IconBlockProps {
  type: ElementType;
  index?: number;
}
export const IconBlock = ({ type, index = 1 }: IconBlockProps) => {
  const getIcon = () => {
    switch (type) {
      case "ul":
        return "•";
      case "ol":
        return `${index}.`;
      case "checkbox":
        return <input type="checkbox" />;
      default:
        return null;
    }
  };
  const icon = getIcon();
  if (!icon) return null;
  return (
    <div style={{ marginRight: "8px" }}>
      <span>{icon}</span>
    </div>
  );
};
