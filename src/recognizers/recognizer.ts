export abstract class Recognizer {
    language: string;
    running: boolean = false;

    constructor(lang: string) {
        this.language = lang;
    }

    abstract start(): void;
    abstract stop(): void;
    abstract set_lang(lang: string): void;
    abstract status(): unknown;
    abstract name(): string;

    abstract manual_trigger(data: string): void;
    abstract onResult(callback: (result: string, final: boolean) => void): void;
}