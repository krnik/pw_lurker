import { PWResult, PWError } from "./error";

export class Elem<E extends HTMLElement = HTMLElement> {
    public static fromElement<E extends HTMLElement>(element: E): Elem<E> {
        return new Elem(element);
    }

    public static create<E extends HTMLElement> (selector: string, source?: Elem): PWResult<Elem<E>> {
        return source !== undefined
            ? source.query(selector)
            : PWResult
                .errIfNull(
                    document.querySelector<E>(selector),
                    () => PWError.noElem({ selector })
                )
                .map(this.fromElement);
    }

    private element: E;

    constructor (element: E) {
        this.element = element;
    }

    public query<E extends HTMLElement>(selector: string): PWResult<Elem<E>> {
        return PWResult
            .errIfNull(
                this.element.querySelector<E>(selector),
                () => PWError.noElem({ selector }),
            )
            .map(Elem.fromElement);
    }

    public queryAll<E extends HTMLElement>(selector: string): Elem<E>[] {
        return Array
            .from(this.element.querySelectorAll<E>(selector))
            .map(Elem.fromElement);
    }

    public type<This extends HTMLInputElement>(this: Elem<This>, value: string): void {
        this.element.value = value;
    }

    public submit<This extends HTMLFormElement>(this: Elem<This>): void {
        this.element.submit();
    }

    public click(): void {
        this.element.click();
    }

    public text (): string {
        return this.element.textContent || '';
    }

    public attr (attributeName: string): PWResult<string> {
        return PWResult
            .errIfNull(
                this.element.getAttribute(attributeName),
                () => PWError.new('MISSING_ATTRIBUTE', { attributeName }),
            );
    }

    public hasClass (value: string): boolean {
        return this.element.classList.contains(value);
    }

    public classList (): string[] {
        return Array.from(this.element.classList.values());
    }

    public childNodes (): NodeListOf<ChildNode> {
        return this.element.childNodes;
    }

    public one<E extends HTMLElement> (selector: string): PWResult<Elem<E>> {
        return PWResult
            .errIfNull(
                this.element.querySelector<E>(selector),
                () => PWError.new('ELEM_NOT_FOUND', { selector }),
            )
            .map(Elem.fromElement);
    }

    public many<E extends HTMLElement> (selector: string): Elem<E>[] {
        return Array.from(this.element.querySelectorAll<E>(selector)).map(Elem.fromElement);
    }
}
