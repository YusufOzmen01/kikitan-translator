export abstract class Recognizer {
    language_src: string;
    language_target: string;
    running: boolean = false;

    constructor(language_src: string, language_target: string) {
        this.language_src = language_src;
        this.language_target = language_target
    }

    abstract start(): void;
    abstract stop(): void;
    abstract status(): unknown;
    abstract name(): string;

    abstract manual_trigger(data: string): void;
    abstract onResult(callback: (result: string[], final: boolean) => void): void;
}