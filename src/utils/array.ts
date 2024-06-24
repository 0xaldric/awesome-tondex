export function filterUndefinedValues<T>(arr: (T | null | undefined)[]): T[] {
    return arr.reduce((res: T[], v) => {
        if (v !== undefined && v !== null) return [...res, v];
        return res;
    }, []);
}
