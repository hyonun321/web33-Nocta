import {
  RemotePageCreateOperation,
  RemoteBlockInsertOperation,
  RemoteBlockDeleteOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
  RemoteBlockUpdateOperation,
  RemoteBlockReorderOperation,
  RemoteCharUpdateOperation,
  RemotePageDeleteOperation,
  RemotePageUpdateOperation,
  CursorPosition,
  WorkSpaceSerializedProps,
} from "@noctaCrdt/Interfaces";
import { io, Socket } from "socket.io-client";
import { create } from "zustand";

interface SocketStore {
  socket: Socket | null;
  clientId: number | null;
  workspace: WorkSpaceSerializedProps | null;
  init: (accessToken: string | null) => void;
  cleanup: () => void;
  fetchWorkspaceData: () => WorkSpaceSerializedProps | null;
  sendPageCreateOperation: (operation: RemotePageCreateOperation) => void;
  sendPageDeleteOperation: (operation: RemotePageDeleteOperation) => void;
  sendPageUpdateOperation: (operation: RemotePageUpdateOperation) => void;
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void;
  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => void;
  sendCharInsertOperation: (operation: RemoteCharInsertOperation) => void;
  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => void;
  sendCharDeleteOperation: (operation: RemoteCharDeleteOperation) => void;
  sendCharUpdateOperation: (operation: RemoteCharUpdateOperation) => void;
  sendBlockReorderOperation: (operation: RemoteBlockReorderOperation) => void;
  sendCursorPosition: (position: CursorPosition) => void;
  subscribeToRemoteOperations: (handlers: RemoteOperationHandlers) => (() => void) | undefined;
  subscribeToPageOperations: (handlers: PageOperationsHandlers) => (() => void) | undefined;
  setWorkspace: (workspace: WorkSpaceSerializedProps) => void;
}

interface RemoteOperationHandlers {
  onRemoteBlockUpdate: (operation: RemoteBlockUpdateOperation) => void;
  onRemoteBlockInsert: (operation: RemoteBlockInsertOperation) => void;
  onRemoteBlockDelete: (operation: RemoteBlockDeleteOperation) => void;
  onRemoteBlockReorder: (operation: RemoteBlockReorderOperation) => void;
  onRemoteCharInsert: (operation: RemoteCharInsertOperation) => void;
  onRemoteCharDelete: (operation: RemoteCharDeleteOperation) => void;
  onRemoteCharUpdate: (operation: RemoteCharUpdateOperation) => void;
  onRemoteCursor: (position: CursorPosition) => void;
}

interface PageOperationsHandlers {
  onRemotePageCreate: (operation: RemotePageCreateOperation) => void;
  onRemotePageDelete: (operation: RemotePageDeleteOperation) => void;
  onRemotePageUpdate: (operation: RemotePageUpdateOperation) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  clientId: null,
  workspace: null,

  init: (id: string | null) => {
    const { socket: existingSocket } = get();

    if (existingSocket) {
      existingSocket.disconnect();
    }

    const SERVER_URL =
      process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://nocta.site";

    const socket = io(SERVER_URL, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        userId: id,
      },
      autoConnect: false,
    });

    socket.on("assign/clientId", (clientId: number) => {
      console.log("Assigned client ID:", clientId);
      set({ clientId });
    });

    socket.on("workspace", (workspace: WorkSpaceSerializedProps) => {
      console.log("Received initial workspace state:", workspace);
      set({ workspace });
    });

    socket.on("connect", () => {
      console.log("Connected to server");
      set({ socket });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("error", (error: Error) => {
      console.error("Socket error:", error);
    });

    socket.connect();
  },

  cleanup: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      set({ socket: null, workspace: null, clientId: null });
    }
  },

  fetchWorkspaceData: () => get().workspace,

  setWorkspace: (workspace: WorkSpaceSerializedProps) => set({ workspace }),

  sendPageUpdateOperation: (operation: RemotePageUpdateOperation) => {
    const { socket } = get();
    socket?.emit("update/page", operation);
    console.log("페이지 업데이트 송신", operation);
  },

  sendPageCreateOperation: (operation: RemotePageCreateOperation) => {
    const { socket } = get();
    socket?.emit("create/page", operation);
    console.log("페이지 만들기 송신", operation);
  },
  sendPageDeleteOperation: (operation: RemotePageDeleteOperation) => {
    const { socket } = get();
    socket?.emit("delete/page", operation);
    console.log("페이지 삭제 송신", operation);
  },
  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => {
    const { socket } = get();
    socket?.emit("insert/block", operation);
  },

  sendCharInsertOperation: (operation: RemoteCharInsertOperation) => {
    const { socket } = get();
    socket?.emit("insert/char", operation);
  },

  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => {
    const { socket } = get();
    socket?.emit("update/block", operation);
  },

  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => {
    const { socket } = get();
    socket?.emit("delete/block", operation);
  },

  sendCharDeleteOperation: (operation: RemoteCharDeleteOperation) => {
    const { socket } = get();
    socket?.emit("delete/char", operation);
  },

  sendCharUpdateOperation: (operation: RemoteCharUpdateOperation) => {
    const { socket } = get();
    socket?.emit("update/char", operation);
  },

  sendCursorPosition: (position: CursorPosition) => {
    const { socket } = get();
    socket?.emit("cursor", position);
  },

  sendBlockReorderOperation: (operation: RemoteBlockReorderOperation) => {
    const { socket } = get();
    socket?.emit("reorder/block", operation);
  },

  subscribeToRemoteOperations: (handlers: RemoteOperationHandlers) => {
    const { socket } = get();
    if (!socket) return;

    socket.on("update/block", handlers.onRemoteBlockUpdate);
    socket.on("insert/block", handlers.onRemoteBlockInsert);
    socket.on("delete/block", handlers.onRemoteBlockDelete);
    socket.on("reorder/block", handlers.onRemoteBlockReorder);
    socket.on("insert/char", handlers.onRemoteCharInsert);
    socket.on("delete/char", handlers.onRemoteCharDelete);
    socket.on("update/char", handlers.onRemoteCharUpdate);
    socket.on("cursor", handlers.onRemoteCursor);

    return () => {
      socket.off("update/block", handlers.onRemoteBlockUpdate);
      socket.off("insert/block", handlers.onRemoteBlockInsert);
      socket.off("delete/block", handlers.onRemoteBlockDelete);
      socket.off("reorder/block", handlers.onRemoteBlockReorder);
      socket.off("insert/char", handlers.onRemoteCharInsert);
      socket.off("delete/char", handlers.onRemoteCharDelete);
      socket.off("update/char", handlers.onRemoteCharUpdate);
      socket.off("cursor", handlers.onRemoteCursor);
    };
  },

  subscribeToPageOperations: (handlers: PageOperationsHandlers) => {
    const { socket } = get();
    if (!socket) return;
    socket.on("create/page", handlers.onRemotePageCreate);
    socket.on("delete/page", handlers.onRemotePageDelete);
    socket.on("update/page", handlers.onRemotePageUpdate);
    return () => {
      socket.off("create/page", handlers.onRemotePageCreate);
      socket.off("delete/page", handlers.onRemotePageDelete);
      socket.off("update/page", handlers.onRemotePageUpdate);
    };
  },
}));
