import Peer, { DataConnection, MediaConnection } from "peerjs";

class PeerManager {
  private _peer: Peer | null = null;
  private _connections: Map<string, DataConnection[]> = new Map();
  private _mediaConnections: Map<string, MediaConnection> = new Map();
  private _remoteStreams: Map<string, MediaStream> = new Map();
  private _pendingCall: MediaConnection | null = null;

  private _fileTransfers = new Map<
    string,
    {
      peerId: string;
      direction: "incoming" | "outgoing";
      chunks: ArrayBuffer[];
      meta?: { fileName: string; fileSize: number; mimeType?: string };
      file?: File;
      abortController?: AbortController;
    }
  >();

  get peer(): Peer | null {
    return this._peer;
  }

  set peer(newPeer: Peer | null) {
    this._peer = newPeer;
  }

  get pendingCall(): MediaConnection | null {
    return this._pendingCall;
  }

  set pendingCall(call: MediaConnection | null) {
    this._pendingCall = call;
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
      file?: File; // Add optional file for outgoing transfers
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
      file: config.file, // Store the file
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

    // If we already have the file (outgoing), return it
    if (transfer.file) return transfer.file;

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

    // If we have the file (outgoing), return it directly
    if (transfer.file) return transfer.file;

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
    const conns = this._connections.get(peerId);
    if (!conns || conns.length === 0) return undefined;
    
    // Return the latest OPEN connection
    for (let i = conns.length - 1; i >= 0; i--) {
      if (conns[i].open) return conns[i];
    }
    
    return conns[conns.length - 1];
  }

  addConnection(conn: DataConnection): void {
    const existing = this._connections.get(conn.peer) || [];
    
    // Avoid duplicates
    if (!existing.includes(conn)) {
      existing.push(conn);
      this._connections.set(conn.peer, existing);
    }
  }

  removeConnection(connOrId: string | DataConnection): void {
    let peerId: string;
    let connToRemove: DataConnection | undefined;

    if (typeof connOrId === 'string') {
      peerId = connOrId;
    } else {
      peerId = connOrId.peer;
      connToRemove = connOrId;
    }

    const conns = this._connections.get(peerId);
    if (!conns) return;

    if (connToRemove) {
      // Remove specific connection
      const newConns = conns.filter(c => c !== connToRemove);
      if (newConns.length === 0) {
        this._connections.delete(peerId);
      } else {
        this._connections.set(peerId, newConns);
      }
      
      // Close the specific connection if open
      if (connToRemove.open) connToRemove.close();
      
    } else {
      // Remove ALL connections for this peer (legacy behavior support)
      conns.forEach(c => {
        if (c.open) c.close();
      });
      this._connections.delete(peerId);
    }
  }

  hasConnection(peerId: string): boolean {
    const conns = this._connections.get(peerId);
    return !!conns && conns.some(c => c.open);
  }

  getAllConnections(): DataConnection[] {
    const all: DataConnection[] = [];
    this._connections.forEach(conns => all.push(...conns));
    return all;
  }

  getMediaConnection(peerId: string): MediaConnection | undefined {
    return this._mediaConnections.get(peerId);
  }

  addMediaConnection(call: MediaConnection): void {
    if (!this._mediaConnections.has(call.peer)) {
      this._mediaConnections.set(call.peer, call);
    }
  }

  removeMediaConnection(peerId: string): void {
    const call = this._mediaConnections.get(peerId);
    if (call) {
      call.close();
    }
    this._mediaConnections.delete(peerId);
    this._remoteStreams.delete(peerId);
  }

  setRemoteStream(peerId: string, stream: MediaStream): void {
    this._remoteStreams.set(peerId, stream);
  }

  getRemoteStream(peerId: string): MediaStream | undefined {
    return this._remoteStreams.get(peerId);
  }

  hasMediaConnection(peerId: string): boolean {
    return this._mediaConnections.has(peerId);
  }

  getAllMediaConnections(): MediaConnection[] {
    return Array.from(this._mediaConnections.values());
  }

  private _activeLocalStreams: MediaStream[] = [];

  registerLocalStream(stream: MediaStream) {
    if (!this._activeLocalStreams.find(s => s.id === stream.id)) {
      this._activeLocalStreams.push(stream);
    }
  }

  cleanupAllLocalStreams() {
    this._activeLocalStreams.forEach(stream => {
      try {
        stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
      } catch (e) {
        console.error("Error stopping track:", e);
      }
    });
    this._activeLocalStreams = [];
  }

  reset(): void {
    this.cleanupAllLocalStreams(); // Cleanup local streams first

    this._connections.forEach((conns) => {
      conns.forEach(c => c.close());
    });
    this._connections.clear();

    this._mediaConnections.forEach((call) => {
      call.close();
    });
    this._mediaConnections.clear();
    this._remoteStreams.clear();

    if (this._peer) {
      this._peer.destroy();
      this._peer = null;
    }
  }
}

const peerManager = new PeerManager();
export default peerManager;
