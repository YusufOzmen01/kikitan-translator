export abstract class Recognizer {
    language: string;
    running: boolean = false;

    constructor(lang: string) {
        this.language = lang;
    }

    abstract start(): void;
    abstract stop(): void;
    abstract set_lang(lang: string): void;

    abstract onResult(callback: (result: string, final: boolean) => void): void;
}