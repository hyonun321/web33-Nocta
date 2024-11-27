export class BatchProcessor {
  private batch: any[] = [];
  private batchTimeout: number;
  private batchTimer: any;
  private sendBatchCallback: (batch: any[]) => void;

  constructor(sendBatchCallback: (batch: any[]) => void, batchTimeout: number = 500) {
    this.sendBatchCallback = sendBatchCallback;
    this.batchTimeout = batchTimeout;
  }

  addOperation(operation: any) {
    this.batch.push(operation);
    if (!this.batchTimer) {
      this.startBatchTimer();
    }
  }

  private startBatchTimer() {
    this.batchTimer = setTimeout(() => {
      this.executeBatch();
    }, this.batchTimeout);
  }

  private executeBatch() {
    if (this.batch.length > 0) {
      this.sendBatchCallback(this.batch);
      this.batch = [];
    }
    clearTimeout(this.batchTimer);
    this.batchTimer = null;
  }
}
