import Peer, { DataConnection, MediaConnection } from "peerjs";

class PeerManager {
  private _peer: Peer | null = null;
  private _connections: Map<string, DataConnection> = new Map();
  private _mediaConnections: Map<string, MediaConnection> = new Map();
  private _pendingCall: MediaConnection | null = null;

  get pendingCall(): MediaConnection | null {
    return this._pendingCall;
  }

  set pendingCall(call: MediaConnection | null) {
    this._pendingCall = call;
  }

  private _fileTransfers = new Map<
    string,
    {
      peerId: string;
      direction: "incoming" | "outgoing";
      chunks: ArrayBuffer[];
      meta?: { fileName: string; fileSize: number; mimeType?: string };
      abortController?: AbortController;
    }
  >();

  get peer(): Peer | null {
    return this._peer;
  }

  set peer(newPeer: Peer | null) {
    this._peer = newPeer;
    console.log("[PeerManager] Peer instance set:", newPeer?.id);
  }

  getTransfer(transferId: string) {
    return this._fileTransfers.get(transferId);
  }

  startFileTransfer(
    transferId: string,
    config: {
      peerId: string;
      direction: "incoming" | "outgoing";
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
    }
  ) {
    this._fileTransfers.set(transferId, {
      peerId: config.peerId,
      direction: config.direction,
      chunks: [],
      meta: config.fileName
        ? {
            fileName: config.fileName,
            fileSize: config.fileSize || 0,
            mimeType: config.mimeType,
          }
        : undefined,
      abortController:
        config.direction === "outgoing" ? new AbortController() : undefined,
    });
  }

  appendFileChunk(transferId: string, chunk: ArrayBuffer): void {
    const transfer = this._fileTransfers.get(transferId);
    if (transfer) {
      transfer.chunks.push(chunk);
    }
  }

  finalizeFileTransfer(transferId: string): File | null {
    const transfer = this._fileTransfers.get(transferId);
    if (!transfer || !transfer.meta) return null;

    const blob = new Blob(transfer.chunks);
    const file = new File([blob], transfer.meta.fileName, {
      type: transfer.meta.mimeType,
      lastModified: Date.now(),
    });

    this._fileTransfers.delete(transferId);
    return file;
  }

  getFile(
    transferId: string
  ): File | { name: string; size: number; type?: string } | null {
    const transfer = this._fileTransfers.get(transferId);

    if (!transfer || !transfer.meta) return null;

    if (transfer.direction === "outgoing") {
      return {
        name: transfer.meta.fileName,
        size: transfer.meta.fileSize,
        type: transfer.meta.mimeType,
      };
    }

    if (transfer.chunks.length > 0) {
      const blob = new Blob(transfer.chunks);
      return new File([blob], transfer.meta.fileName, {
        type: transfer.meta.mimeType,
        lastModified: Date.now(),
      });
    }
    return null;
  }

  cancelFileTransfer(transferId: string): void {
    const transfer = this._fileTransfers.get(transferId);
    transfer?.abortController?.abort();
    this._fileTransfers.delete(transferId);
  }

  getConnection(peerId: string): DataConnection | undefined {
    return this._connections.get(peerId);
  }

  addConnection(conn: DataConnection): void {
    this._connections.set(conn.peer, conn);
    console.log(
      `[PeerManager] Added/Updated DataConnection for peer: ${conn.peer}`
    );
  }

  removeConnection(peerId: string): void {
    const conn = this._connections.get(peerId);
    if (conn && conn.open) {
      console.log(`[PeerManager] Closing DataConnection for peer: ${peerId}`);
      conn.close();
    }
    this._connections.delete(peerId);
    console.log(`[PeerManager] Removed DataConnection for peer: ${peerId}`);
  }

  hasConnection(peerId: string): boolean {
    return this._connections.has(peerId);
  }

  getAllConnections(): DataConnection[] {
    return Array.from(this._connections.values());
  }

  getMediaConnection(peerId: string): MediaConnection | undefined {
    return this._mediaConnections.get(peerId);
  }

  addMediaConnection(call: MediaConnection): void {
    if (!this._mediaConnections.has(call.peer)) {
      this._mediaConnections.set(call.peer, call);
      console.log(`[PeerManager] Added MediaConnection for peer: ${call.peer}`);
    } else {
      console.log(
        `[PeerManager] MediaConnection for peer ${call.peer} already exists`
      );
    }
  }

  removeMediaConnection(peerId: string): void {
    const call = this._mediaConnections.get(peerId);
    if (call) {
      console.log(`[PeerManager] Closing MediaConnection for peer: ${peerId}`);
      call.close();
    }
    this._mediaConnections.delete(peerId);
    console.log(`[PeerManager] Removed MediaConnection for peer: ${peerId}`);
  }

  hasMediaConnection(peerId: string): boolean {
    return this._mediaConnections.has(peerId);
  }

  getAllMediaConnections(): MediaConnection[] {
    return Array.from(this._mediaConnections.values());
  }

  reset(): void {
    this._connections.forEach((conn, peerId) => {
      console.log(
        `[PeerManager] Reset: Closing DataConnection for peer: ${peerId}`
      );
      conn.close();
    });
    this._connections.clear();

    this._mediaConnections.forEach((call, peerId) => {
      console.log(
        `[PeerManager] Reset: Closing MediaConnection for peer: ${peerId}`
      );
      call.close();
    });
    this._mediaConnections.clear();

    if (this._peer) {
      console.log("[PeerManager] Reset: Destroying Peer instance");
      this._peer.destroy();
      this._peer = null;
    }
  }
}

const peerManager = new PeerManager();
export default peerManager;
