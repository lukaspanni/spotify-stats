export class PaginationData {
  private _total: number;
  private _currentLimit: number;
  private _currentOffset: number;
  private handlers: Map<string, (value: PaginationData) => void> = new Map();

  public get total(): number {
    return this._total;
  }

  public set total(value: number) {
    if (value < 0 || this._total === value) return;
    this._total = value;
    this.onChanged();
  }

  public get currentLimit(): number {
    return this._currentLimit;
  }

  public set currentLimit(value: number) {
    if (value < 0 || this._currentLimit === value) return;
    this._currentLimit = Math.min(value, this._total);
    this.onChanged();
  }

  public get currentOffset(): number {
    return this._currentOffset;
  }

  public get remainingElements(): number {
    return Math.min(this._total - this._currentOffset - this._currentLimit);
  }

  constructor(total: number, currentLimit: number, currentOffset: number) {
    this._total = total;
    this._currentLimit = currentLimit;
    this._currentOffset = currentOffset;
  }

  public updateOffset(): void {
    if (this.remainingElements > 0) {
      this._currentOffset += this._currentLimit;
      this.onChanged();
    }
  }

  public reset(total: number, currentLimit: number, currentOffset: number): void {
    this._total = total;
    this._currentLimit = currentLimit;
    this._currentOffset = currentOffset;
  }

  public registerChangedHandler(key: string, handler: (value: PaginationData) => void): void {
    this.handlers.set(key, handler);
  }

  public unregisterChangedHandler(key: string): void {
    this.handlers.delete(key);
  }

  private onChanged(): void {
    this.handlers.forEach((handler) => handler(this));
  }
}
