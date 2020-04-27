export type NullOr<T> = null | T;

export class PWError {
    public static new (kind: string, context: object): PWError {
        return new PWError(kind, context);
    }

    public static noElem (context: object): PWError {
        return new PWError('ELEM_NOT_FOUND', context);
    }

    public static numberConversion (value: unknown): PWError {
        const context = { value, reason: 'Illegal number conversion' };
        return new PWError('NUMBER_CONVERSION', context);
    }

    private kind: string;
    private context: object;

    private constructor (kind: string, context: object) {
        this.kind = kind;
        this.context = context;
    }

    public value (): { kind: string, context: object } {
        return { kind: this.kind, context: this.context };
    }
}

type UnRes<T> = T extends PWResult<infer U> ? U : T;

export class PWResult<T> {
    public static ok<R> (value: R): PWResult<R> {
        return new PWResult(value, null);
    }

    public static err<R> (error: PWError): PWResult<R> {
        return new PWResult<R>(null, error);
    }

    public static errIfNull<R> (value: R | null, errFn: () => PWError): PWResult<R> {
        return value === null ? PWResult.err(errFn()) : PWResult.ok(value);
    }

    public static flat<R> (results: PWResult<R>[]): PWResult<R[]> {
        const { items, err } = results.reduce<{ items: R[], err: NullOr<PWError> }>((acc, res) => {
            if (res.err !== null && acc.err === null) {
                acc.err = res.err; 
            }

            if (res.ok !== null) {
                acc.items.push(res.ok);
            }

            return acc;
        }, { items: [], err: null });

        return err !== null ? PWResult.err(err) : PWResult.ok(items);
    }

    protected err: NullOr<PWError>;
    protected ok: NullOr<T>;

    private constructor (ok: NullOr<T>, err: NullOr<PWError>) {
        this.ok = ok;
        this.err = err;

        if (this.ok === null && this.err === null) {
            throw PWError.new('RUNTIME_ERROR', {
                reason: 'Invalid constructor parameters "ok" and "err"'
            });
        }
    }

    public map<U> (fn: (current: T) => U): PWResult<UnRes<U>> {
        if (this.ok !== null) {
            try {
                this.ok = fn(this.ok) as any;
                if (this.ok instanceof PWResult) {
                    this.ok = this.ok.ok;
                }
            } catch (error) {
                this.err = error instanceof PWError ? error : PWError.new('RUNTIME_ERROR', { context: 'PWResult.prototype.map' });
                this.ok = null;
            }
        }

        return this as any;
    }

    public unwrap (): T {
        if (this.ok !== null) {
            return this.ok;
        }

        throw this.err;
    }

    public toObject (): { ok: T, err: null } | { ok: null, err: PWError } {
        return {
            ok: this.ok,
            err: this.err,
        } as { ok: T, err: null };
    }
}
