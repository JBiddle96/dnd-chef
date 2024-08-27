import { lazy, Suspense, useEffect, useState } from "react";
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import type { Day } from "date-fns";
import { format, nextDay, differenceInDays, differenceInWeeks, addWeeks, startOfDay } from "date-fns";
import { CardContent, CardHeader, CircularProgress } from '@mui/material';
import isEqual from 'lodash.isequal';

// Import the functions you need from the SDKs you need
import { dayLookup, pRow } from "./util";
import { Person } from "./types";
import { expireStaleCreditData, pushChefData } from "./data"
import { loadFirestore, loadRemoteConfig } from "./firebase.ts";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries



function calculateChef(chefs: Person[], selectedDate: Date, offset: number): Person | undefined {
  if (chefs.length === 0) return
  let nCycles = differenceInWeeks(selectedDate, startOfDay(new Date()))
  let offsetChefs = pRow(chefs, offset)
  const credit = new Map<string, number>(offsetChefs.map((p) => [p.name, p.credit]))
  let chosenChef: Person | undefined
  outer: while (nCycles >= 0) {
    for (let chef of offsetChefs) {
      const chefCredit = credit.get(chef.name)
      if (chefCredit && chefCredit > 0) {
        credit.set(chef.name, chefCredit - 1)
      }
      else {
        chosenChef = chef
        nCycles -= 1
        if (nCycles < 0) break outer
      }
    }
  }
  return chosenChef
}

function findNextChefOccurence(target: Person, chefs: Person[], offset: number): number | undefined {
  if (!chefs.map((p) => p.name).includes(target.name)) return
  let offsetChefs = pRow(chefs, offset)
  const credit = new Map<string, number>(chefs.map((p) => [p.name, p.credit]))
  let nWeeks = 0
  outerLoop: while (true) {
    for (let chef of offsetChefs) {
      const chefCredit = credit.get(chef.name)
      if (chefCredit && chefCredit > 0) {
        credit.set(chef.name, chefCredit - 1)
      }
      else {
        if (chef.name === target.name) {
          break outerLoop
        }
        nWeeks += 1
      }
    }
  }
  return nWeeks
}

function ChefDisplay({ chefName, day }: { chefName: string, day: Date }) {
  const date_str = format(day, "E - d/M/uu")
  return (
    <Card sx={{ width: 1 }}>
      <CardHeader title={`Next D&D session: ${date_str}`}></CardHeader>
      <CardContent>{`Chef: ${chefName}`}</CardContent>
    </Card>
  )
}

const ChefControlGroup = lazy(() => import('./controls.tsx'))
const DateSelector = lazy(() => import('./date-selection.tsx').then(module => ({ default: module.DateSelector })))
const DaySelector = lazy(() => import('./date-selection.tsx').then(module => ({ default: module.DaySelector })))

function App() {
  // addDefaultData(true)
  const initDate = new Date("2024-08-05T00:00:00+09:30")

  const [chefData, setChefData] = useState<Array<Person>>([]);
  const [selectedDnDDay, setSelectedDnDDay] = useState<string>("sunday");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // The date picked in the calendar

  function nextSessionFromDate(date: Date): Date {
    const nextSession = date.getDay() == dndDayOfWeek ? startOfDay(date) : nextDay(date, dndDayOfWeek)
    return nextSession
  }

  useEffect(() => {
    async function fetchData() {
      const db = await loadFirestore()
      const { collection, query, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, "chefs"));
      const querySnapshot = await getDocs(q);
      const chefs: Person[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const chef = { name: data.name, order: data.order, credit: data.credit, creditDate: data.creditDate ? data.creditDate.toDate() : null }
        chefs.push(chef)
      });
      chefs.sort((a, b) => a.order - b.order)
      expireStaleCreditData(chefs)
      setAndPushChefData(chefs)
    }
    fetchData()
  }, [])

  function setAndPushChefData(newChefData: Person[]) {
    if (chefData.length !== newChefData?.length) { pushChefData(newChefData) }
    const changed = newChefData.filter((chef, i) => !isEqual(chef, chefData[i]))
    if (changed) pushChefData(changed)
    setChefData(newChefData)
  }

  useEffect(() => {
    async function setDay() {
      const { getValue } = await import('firebase/remote-config');
      const remoteConfig = await loadRemoteConfig()
      const dndDayOfWeekStr = getValue(remoteConfig, "dnd_day").asString()
      setSelectedDnDDay(dndDayOfWeekStr)
    }
    setDay()
  }, [])

  function onSelectDate(newDate: Date | null) {
    const today = new Date()
    newDate = newDate ? newDate : today
    if (differenceInDays(newDate, today) < 0) {
      newDate = today
    }
    setSelectedDate(newDate)
  }

  function onFindNextChef(chef: Person) {
    const nWeeks = findNextChefOccurence(chef, chefData, offset)
    if (!(nWeeks === undefined)) {
      setSelectedDate(addWeeks(nextSessionDayFromToday, nWeeks))
    }
  }

  function onChangeCredit(chef: Person, newCredit: number) {
    const newChef = structuredClone(chef)
    if (newCredit < 0) return
    const idx = chefData.indexOf(chef)
    if (idx == -1) return
    newChef.credit = newCredit
    if (newCredit > 0) {
      newChef.creditDate = new Date()
    }
    else {
      newChef.creditDate = null
    }
    setAndPushChefData([...chefData.slice(0, idx), newChef, ...chefData.slice(idx + 1)])
  }

  const dndDayOfWeek: Day = dayLookup.get(selectedDnDDay) ?? 0
  const nextSessionDayFromToday = nextSessionFromDate(new Date())
  const initDay = initDate.getDay() === dndDayOfWeek ? initDate : nextDay(initDate, dndDayOfWeek)
  const offset = chefData ? differenceInWeeks(nextSessionDayFromToday, initDay) % chefData.length : 0

  const nextSessionDayFromSelected = nextSessionFromDate(selectedDate)

  let selectedChef: Person | undefined
  selectedChef = calculateChef(chefData, nextSessionDayFromSelected, offset)
  const chefName = selectedChef ? selectedChef.name : "Unknown"

  return (
    <>
      <CssBaseline />
      <Container maxWidth="md">
        <Box display="flex" flexDirection="column" justifyContent="center" height="100vh">
          <Suspense fallback={<CircularProgress />}>
            <Stack direction="column" spacing={2} justifyContent="center" alignItems="center">
              <ChefDisplay chefName={chefName} day={nextSessionDayFromSelected}></ChefDisplay>
              <Stack width={1} spacing={2} direction="row">
                <DateSelector onSelect={onSelectDate} defaultValue={selectedDate}></DateSelector>
                <DaySelector defaultDay={selectedDnDDay} handleSelect={setSelectedDnDDay}></DaySelector>
              </Stack>
              <ChefControlGroup chefs={chefData} onFindNext={onFindNextChef} onChangeCredit={onChangeCredit}></ChefControlGroup>
            </Stack>
          </Suspense>
        </Box>
      </Container>
    </>
  )
}

export default App
