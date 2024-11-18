import {
  RemoteInsertOperation,
  RemoteDeleteOperation,
  CursorPosition,
} from "@noctaCrdt/Interfaces";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

// 구독 핸들러들의 타입 정의
interface RemoteOperationHandlers {
  onRemoteInsert: (operation: RemoteInsertOperation) => void;
  onRemoteDelete: (operation: RemoteDeleteOperation) => void;
  onRemoteCursor: (position: CursorPosition) => void;
}

// 훅의 반환 타입을 명시적으로 정의
interface UseSocketReturn {
  socket: Socket | null;
  sendInsertOperation: (operation: RemoteInsertOperation) => void;
  sendDeleteOperation: (operation: RemoteDeleteOperation) => void;
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

    socketRef.current.on("document", (document: any) => {
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

  const sendInsertOperation = (operation: RemoteInsertOperation) => {
    socketRef.current?.emit("insert", operation);
    console.log(operation);
  };

  const sendDeleteOperation = (operation: RemoteDeleteOperation) => {
    socketRef.current?.emit("delete", operation);
  };

  const sendCursorPosition = (position: CursorPosition) => {
    socketRef.current?.emit("cursor", position);
  };

  const subscribeToRemoteOperations = ({
    onRemoteInsert,
    onRemoteDelete,
    onRemoteCursor,
  }: RemoteOperationHandlers) => {
    if (!socketRef.current) return;

    socketRef.current.on("insert", onRemoteInsert);
    socketRef.current.on("delete", onRemoteDelete);
    socketRef.current.on("cursor", onRemoteCursor);

    return () => {
      socketRef.current?.off("insert", onRemoteInsert);
      socketRef.current?.off("delete", onRemoteDelete);
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
