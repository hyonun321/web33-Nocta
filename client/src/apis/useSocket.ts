import {
  RemoteBlockInsertOperation,
  RemoteBlockDeleteOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
  CursorPosition,
  SerializedProps,
} from "@noctaCrdt/Interfaces";
import { Block, Char } from "@noctaCrdt/Node";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
// 구독 핸들러들의 타입 정의
interface RemoteOperationHandlers {
  onRemoteBlockInsert: (operation: RemoteBlockInsertOperation) => void;
  onRemoteBlockDelete: (operation: RemoteBlockDeleteOperation) => void;
  onRemoteCharInsert: (operation: RemoteCharInsertOperation) => void;
  onRemoteCharDelete: (operation: RemoteCharDeleteOperation) => void;
  onRemoteCursor: (position: CursorPosition) => void;
}

// 훅의 반환 타입을 명시적으로 정의
interface UseSocketReturn {
  socket: Socket | null;
  sendInsertOperation: (operation: RemoteBlockInsertOperation | RemoteCharInsertOperation) => void;
  sendDeleteOperation: (operation: RemoteBlockDeleteOperation | RemoteCharDeleteOperation) => void;
  sendCursorPosition: (position: CursorPosition) => void;
  subscribeToRemoteOperations: (handlers: RemoteOperationHandlers) => (() => void) | undefined;
}

// 반환 타입을 명시적으로 지정
export const useSocket = (): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const SERVER_URL =
      process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://api.nocta.site";
    socketRef.current = io(SERVER_URL, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"], // polling도 fallback으로 추가
      withCredentials: true, // CORS credentials 설정
      reconnectionAttempts: 5, // 재연결 시도 횟수
      reconnectionDelay: 1000, // 재연결 시도 간격 (ms)
      autoConnect: true,
    });

    socketRef.current.on("assignId", (clientId: number) => {
      console.log("Assigned client ID:", clientId);
    });

    socketRef.current.on("document", (document: SerializedProps<Block> | SerializedProps<Char>) => {
      // 추후 확인 필요
      console.log("Received initial document state:", document);
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socketRef.current.on("error", (error: Error) => {
      console.error("Socket error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const sendInsertOperation = (
    operation: RemoteBlockInsertOperation | RemoteCharInsertOperation,
  ) => {
    if (operation.node instanceof Block) {
      socketRef.current?.emit("insert/block", operation);
    } else {
      socketRef.current?.emit("insert/char", operation);
    }
    console.log(operation);
  };

  const sendDeleteOperation = (
    operation: RemoteBlockDeleteOperation | RemoteCharDeleteOperation,
  ) => {
    socketRef.current?.emit("delete", operation);
  };

  const sendCursorPosition = (position: CursorPosition) => {
    socketRef.current?.emit("cursor", position);
  };

  const subscribeToRemoteOperations = ({
    onRemoteBlockInsert,
    onRemoteBlockDelete,
    onRemoteCharInsert,
    onRemoteCharDelete,
    onRemoteCursor,
  }: RemoteOperationHandlers) => {
    if (!socketRef.current) return;

    socketRef.current.on("insert/block", onRemoteBlockInsert);
    socketRef.current.on("delete/block", onRemoteBlockDelete);
    socketRef.current.on("insert/char", onRemoteCharInsert);
    socketRef.current.on("delete/char", onRemoteCharDelete);
    socketRef.current.on("cursor", onRemoteCursor);

    return () => {
      socketRef.current?.off("insert/block", onRemoteBlockInsert);
      socketRef.current?.off("delete/block", onRemoteBlockDelete);
      socketRef.current?.off("insert/char", onRemoteCharInsert);
      socketRef.current?.off("delete/char", onRemoteCharDelete);
      socketRef.current?.off("cursor", onRemoteCursor);
    };
  };

  return {
    socket: socketRef.current,
    sendInsertOperation,
    sendDeleteOperation,
    sendCursorPosition,
    subscribeToRemoteOperations,
  };
};
