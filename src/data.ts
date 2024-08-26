import { Person } from "./types.ts";
import { differenceInWeeks, addWeeks } from "date-fns";
import { loadFirestore } from "./firebase.ts";

export const chefs = ["Alison", "Sarah", "Brodie", "Andre", "James"];

export function expireStaleCreditData(chefs: Person[]) {
    const today = Date()
    const cycleLength = chefs.length
    for (let chef of chefs) {
        if (!chef.creditDate) {
            chef.credit = 0
            continue
        }
        let nWeeks = differenceInWeeks(today, chef.creditDate)
        console.log(chef.name, chef.creditDate, cycleLength, nWeeks)
        while (nWeeks > cycleLength) {
            if (chef.credit <= 0) {
                chef.credit = 0
                chef.creditDate = null
                break
            }
            chef.credit -= 1
            nWeeks -= cycleLength
        }
        if (chef.credit > 0 && chef.creditDate) chef.creditDate = addWeeks(chef.creditDate, -nWeeks)
    }
}

export async function pushChefData(chefs: Person[]) {
    const { setDoc, doc } = await import('firebase/firestore');
    const db = await loadFirestore()
    for (let chef of chefs) {
        try {
            await setDoc(doc(db, "chefs", chef.name), chef);
            console.log("Document written with name: ", chef.name);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }
}

export async function addDefaultData(overwrite: boolean = false) {
    const { setDoc, doc } = await import('firebase/firestore');
    const db = await loadFirestore()
    for (const [index, name] of chefs.entries()) {
        try {
            await setDoc(doc(db, "chefs", name), {
                name: name,
                order: index,
                credit: 0,
                creditDate: null
            }, { merge: !overwrite });
            console.log("Document written with name: ", name);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }
}
