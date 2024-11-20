import {
  RemoteBlockInsertOperation,
  RemoteBlockDeleteOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
  RemoteBlockUpdateOperation,
  CursorPosition,
  WorkSpaceSerializedProps,
} from "@noctaCrdt/Interfaces";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
// 구독 핸들러들의 타입 정의
interface RemoteOperationHandlers {
  onRemoteBlockUpdate: (operation: RemoteBlockUpdateOperation) => void;
  onRemoteBlockInsert: (operation: RemoteBlockInsertOperation) => void;
  onRemoteBlockDelete: (operation: RemoteBlockDeleteOperation) => void;
  onRemoteCharInsert: (operation: RemoteCharInsertOperation) => void;
  onRemoteCharDelete: (operation: RemoteCharDeleteOperation) => void;
  onRemoteCursor: (position: CursorPosition) => void;
}

interface PageOperationsHandlers {
  onRemotePageCreate: (operation: string) => void;
}

// 훅의 반환 타입을 명시적으로 정의
interface UseSocketReturn {
  socket: Socket | null;
  fetchWorkspaceData: () => WorkSpaceSerializedProps;
  sendPageCreateOperation: (operation: string) => void;
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void;
  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => void;
  sendCharInsertOperation: (operation: RemoteCharInsertOperation) => void;
  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => void;
  sendCharDeleteOperation: (operation: RemoteCharDeleteOperation) => void;
  sendCursorPosition: (position: CursorPosition) => void;
  subscribeToRemoteOperations: (handlers: RemoteOperationHandlers) => (() => void) | undefined;
  subscribeToPageOperations: (handlers: PageOperationsHandlers) => void;
}

// 반환 타입을 명시적으로 지정
export const useSocket = (): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const [workspace, setWorkspace] = useState<WorkSpaceSerializedProps | null>(null);
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

    socketRef.current.on("workspace", (workspace: WorkSpaceSerializedProps) => {
      console.log("Received initial workspace state:", workspace);
      setWorkspace(workspace);
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

    console.log("소켓 이벤트 on");

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchWorkspaceData = (): WorkSpaceSerializedProps => {
    return workspace!;
  };

  const sendPageCreateOperation = (operation: string) => {
    socketRef.current?.emit("create/page", operation);
    console.log("페이지 만들기 송신", operation);
  };

  const sendBlockInsertOperation = (operation: RemoteBlockInsertOperation) => {
    socketRef.current?.emit("insert/block", operation);
    console.log(operation);
  };

  const sendCharInsertOperation = (operation: RemoteCharInsertOperation) => {
    socketRef.current?.emit("insert/char", operation);

    console.log(operation);
  };

  const sendBlockUpdateOperation = (operation: RemoteBlockUpdateOperation) => {
    socketRef.current?.emit("update/block", operation);
  };

  const sendBlockDeleteOperation = (operation: RemoteBlockDeleteOperation) => {
    socketRef.current?.emit("delete/block", operation);
  };

  const sendCharDeleteOperation = (operation: RemoteCharDeleteOperation) => {
    socketRef.current?.emit("delete/char", operation);
  };

  const sendCursorPosition = (position: CursorPosition) => {
    socketRef.current?.emit("cursor", position);
  };

  const subscribeToRemoteOperations = ({
    onRemoteBlockUpdate,
    onRemoteBlockInsert,
    onRemoteBlockDelete,
    onRemoteCharInsert,
    onRemoteCharDelete,
    onRemoteCursor,
  }: RemoteOperationHandlers) => {
    if (!socketRef.current) return;
    socketRef.current.on("update/block", onRemoteBlockUpdate);
    socketRef.current.on("insert/block", onRemoteBlockInsert);
    socketRef.current.on("delete/block", onRemoteBlockDelete);
    socketRef.current.on("insert/char", onRemoteCharInsert);
    socketRef.current.on("delete/char", onRemoteCharDelete);
    socketRef.current.on("cursor", onRemoteCursor);

    return () => {
      socketRef.current?.off("update/block", onRemoteBlockUpdate);
      socketRef.current?.off("insert/block", onRemoteBlockInsert);
      socketRef.current?.off("delete/block", onRemoteBlockDelete);
      socketRef.current?.off("insert/char", onRemoteCharInsert);
      socketRef.current?.off("delete/char", onRemoteCharDelete);
      socketRef.current?.off("cursor", onRemoteCursor);
    };
  };

  const subscribeToPageOperations = ({ onRemotePageCreate }: PageOperationsHandlers) => {
    if (!socketRef.current) return;
    socketRef.current.on("create/page", onRemotePageCreate);
  };

  return {
    socket: socketRef.current,
    fetchWorkspaceData,
    sendPageCreateOperation,
    sendBlockUpdateOperation,
    sendBlockInsertOperation,
    sendCharInsertOperation,
    sendBlockDeleteOperation,
    sendCharDeleteOperation,
    sendCursorPosition,
    subscribeToRemoteOperations,
    subscribeToPageOperations,
  };
};
