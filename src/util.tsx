import { Day } from "date-fns";

export function pRow(array: Array<any>, offset: number): Array<any> {
    return [
        ...array.slice(offset % array.length),
        ...array.slice(0, offset % array.length)
    ];
} export function TitleCase(string: string) {
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
}
export const dayLookup = new Map<string, Day>([
    ["sunday", 0],
    ["monday", 1],
    ["tuesday", 2],
    ["wednesday", 3],
    ["thursday", 4],
    ["friday", 5],
    ["saturday", 6]
]);

