export const CommonSchema = {
    str: {
        type: 'string',
        minLength: 1,
    },
    int: {
        type: 'number',
        multipleOf: 1,
    },
    uint: {
        type: 'number',
        multipleOf: 1,
        minimum: 0,
    },
};

export const BuildSchema = {
    oneOf (...schemas: object[]): object {
        return { oneOf: schemas };
    },
    array (props: object, items: object): object {
        return { ...props, items, type: 'array' };
    },
};
