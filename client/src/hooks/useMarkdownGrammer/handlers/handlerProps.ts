import { EditorState, MarkdownElement } from "../../../types/markdown";
import { LinkedListBlock } from "../../../utils/linkedLIstBlock";

export interface KeyHandlerProps {
  editorState: EditorState;
  editorList: LinkedListBlock;
  setEditorState: React.Dispatch<React.SetStateAction<EditorState>>;
  checkMarkdownPattern: (text: string) => MarkdownElement | null;
}