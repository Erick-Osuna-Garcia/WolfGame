export class LiveHub {
  private listener: ((code: string) => Promise<void>) | null = null;

  setListener(listener: (code: string) => Promise<void>) {
    this.listener = listener;
  }

  async emit(code: string): Promise<void> {
    if (this.listener) await this.listener(code);
  }
}

export const liveHub = new LiveHub();
